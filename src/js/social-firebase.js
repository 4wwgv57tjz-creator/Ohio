// Firebase-versjonen av leaderboard, venner og innlogging med Facebook / Apple.
// Tas bare med i bygget når online.config.json har "provider": "firebase".
import { initializeApp } from 'firebase/app';
import {
  getAuth, connectAuthEmulator, onAuthStateChanged, signInAnonymously, FacebookAuthProvider, OAuthProvider,
  linkWithPopup, linkWithRedirect, linkWithCredential, signInWithPopup, signInWithCredential, signOut, getRedirectResult, deleteUser,
} from 'firebase/auth';
import {
  getFirestore, connectFirestoreEmulator, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, orderBy,
  limit, getDocs, where, documentId, arrayUnion, arrayRemove, runTransaction, serverTimestamp,
} from 'firebase/firestore';
import { randomCode, normalizeCode } from './social-common.js';

const providerOf = (user) => {
  if (!user || user.isAnonymous) return 'guest';
  const ids = (user.providerData || []).map((p) => p.providerId);
  return ids.includes('apple.com') ? 'apple' : ids.includes('facebook.com') ? 'facebook' : 'guest';
};
const appleProvider = () => { const p = new OAuthProvider('apple.com'); p.addScope('email'); p.addScope('name'); return p; };
const credentialFrom = (name, err) => (name === 'apple' ? OAuthProvider.credentialFromError(err) : FacebookAuthProvider.credentialFromError(err));

export function createFirebaseBackend(cfg, { getState, scoreOf, emit }) {
  const app = initializeApp(cfg.firebase);
  const auth = getAuth(app);
  const db = getFirestore(app);
  if (cfg.emulator) {
    connectAuthEmulator(auth, cfg.emulator.auth || 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, cfg.emulator.host || '127.0.0.1', cfg.emulator.firestorePort || 8080);
  }
  const st = { ready: false, user: null, profile: null, error: '' };
  let lastSubmit = 0;
  let lastSig = '';

  const rowFrom = (id, d, me) => ({ id, name: d.name || '?', score: d.score || 0, era: d.era || 0, prestige: d.prestige || 0, provider: d.provider || 'guest', me });

  async function ensureProfile(user) {
    const ref = doc(db, 'players', user.uid);
    const snap = await getDoc(ref);
    if (snap.exists() && snap.data().code) { st.profile = snap.data(); return; }
    const s = getState();
    const entry = s ? scoreOf(s) : { name: '', score: 0, lifetime: 0, era: 0, prestige: 0, rank: 0 };
    for (let i = 0; i < 8; i++) {
      const code = randomCode();
      try {
        await runTransaction(db, async (tx) => {
          const cref = doc(db, 'codes', code);
          if ((await tx.get(cref)).exists()) throw new Error('taken');
          tx.set(cref, { uid: user.uid });
          tx.set(ref, { ...entry, code, friends: [], provider: providerOf(user), updatedAt: serverTimestamp() }, { merge: true });
        });
        break;
      } catch (e) { if (e.message !== 'taken') throw e; }
    }
    st.profile = (await getDoc(ref)).data() || null;
  }

  // Poeng på nett skal aldri gå ned, selv om en annen enhet har spilt mindre
  function syncBest() {
    const s = getState();
    if (s && st.profile) { s.social = s.social || {}; s.social.best = Math.max(s.social.best || 0, st.profile.score || 0); }
  }
  async function afterSignIn(api) {
    st.user = auth.currentUser;
    await ensureProfile(st.user);
    syncBest();
    await api.submit(true);
    emit();
  }
  // Bytter fra gjest til en konto som finnes fra før (f.eks. innlogget på en annen enhet)
  async function switchToExisting(name, err, fallback) {
    const cred = credentialFrom(name, err) || fallback;
    if (!cred) throw err;
    const cur = auth.currentUser;
    if (cur && cur.isAnonymous) {
      const oldCode = st.profile?.code;
      await deleteDoc(doc(db, 'players', cur.uid)).catch(() => {});
      if (oldCode) await deleteDoc(doc(db, 'codes', oldCode)).catch(() => {});
    }
    st.profile = null;
    await signInWithCredential(auth, cred);
  }

  const api = {
    demo: false,
    async init() {
      try { await getRedirectResult(auth); } catch (e) { st.error = e.code || e.message; }
      await new Promise((resolve) => {
        let done = false;
        const finish = () => { if (!done) { done = true; resolve(); } };
        setTimeout(() => { st.ready = true; if (!st.user) st.error = st.error || 'timeout'; emit(); finish(); }, 12000);
        onAuthStateChanged(auth, async (user) => {
          try {
            if (!user) { await signInAnonymously(auth); return; }
            if (!st.user || st.user.uid !== user.uid) { st.profile = null; st.ready = false; emit(); }
            st.user = user;
            await ensureProfile(user);
            syncBest();
            st.error = '';
          } catch (e) { st.error = e.code || e.message; }
          st.ready = true;
          emit();
          finish();
        });
      });
    },
    state() {
      const u = st.user;
      return { ready: st.ready, demo: false, signedIn: !!u && !u.isAnonymous, provider: providerOf(u), code: st.profile?.code || '', error: st.error };
    },
    async login(name) {
      const provider = name === 'apple' ? appleProvider() : new FacebookAuthProvider();
      try {
        const cur = auth.currentUser;
        if (cur && cur.isAnonymous) {
          try {
            await linkWithPopup(cur, provider); // samme bruker-ID: plassen på listen beholdes
          } catch (e) {
            if (e.code === 'auth/credential-already-in-use' || e.code === 'auth/email-already-in-use') {
              await switchToExisting(name, e);
            } else if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') {
              await linkWithRedirect(cur, provider);
              return { ok: true, redirect: true };
            } else throw e;
          }
        } else await signInWithPopup(auth, provider);
        await afterSignIn(api);
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e.code || e.message };
      }
    },
    async logout() { // onAuthStateChanged lager en ny gjestebruker
      st.user = null; st.profile = null; st.ready = false; emit();
      await signOut(auth);
    },
    async deleteAccount() {
      const u = auth.currentUser;
      if (!u) return { ok: false };
      try {
        const code = st.profile?.code;
        await deleteDoc(doc(db, 'players', u.uid));
        if (code) await deleteDoc(doc(db, 'codes', code)).catch(() => {});
        st.profile = null;
        await deleteUser(u);
        return { ok: true };
      } catch (e) {
        if (e.code === 'auth/requires-recent-login') { await signOut(auth); return { ok: true, partial: true }; }
        return { ok: false, error: e.code || e.message };
      }
    },
    async submit(force = false) {
      const s = getState();
      if (!s || !st.user) return;
      const e = scoreOf(s);
      const pr = st.profile || {};
      e.score = Math.max(e.score, pr.score || 0);
      e.lifetime = Math.max(e.lifetime, pr.lifetime || 0);
      e.era = Math.max(e.era, pr.era || 0);
      e.prestige = Math.max(e.prestige, pr.prestige || 0);
      e.rank = e.score + Math.min(0.999, Math.log10(e.lifetime + 1) / 100);
      const sig = JSON.stringify([e.name, e.score, e.era, e.prestige, Math.floor(Math.log10(e.lifetime + 1) * 10)]);
      if (!force && (sig === lastSig || Date.now() - lastSubmit < 30000)) return;
      lastSig = sig;
      lastSubmit = Date.now();
      try {
        await setDoc(doc(db, 'players', st.user.uid), { ...e, provider: providerOf(st.user), updatedAt: serverTimestamp() }, { merge: true });
        st.profile = { ...pr, ...e };
      } catch (err) { st.error = err.code || err.message; }
    },
    async board(kind) {
      const uid = st.user?.uid;
      if (kind === 'friends') {
        const snap = uid ? await getDoc(doc(db, 'players', uid)) : null;
        const mine = snap && snap.exists() ? snap.data() : {};
        st.profile = { ...(st.profile || {}), ...mine };
        const ids = [uid, ...(mine.friends || [])].filter(Boolean);
        const rows = [];
        for (let i = 0; i < ids.length; i += 10) {
          const qs = await getDocs(query(collection(db, 'players'), where(documentId(), 'in', ids.slice(i, i + 10))));
          qs.forEach((d) => rows.push(rowFrom(d.id, d.data(), d.id === uid)));
        }
        return rows.sort((a, b) => b.score - a.score).map((r, i) => ({ ...r, place: i + 1 }));
      }
      const qs = await getDocs(query(collection(db, 'players'), orderBy('rank', 'desc'), limit(50)));
      const rows = [];
      qs.forEach((d) => rows.push(rowFrom(d.id, d.data(), d.id === uid)));
      const out = rows.map((r, i) => ({ ...r, place: i + 1 }));
      if (uid && !out.some((r) => r.me)) {
        const mine = await getDoc(doc(db, 'players', uid));
        if (mine.exists()) out.push({ ...rowFrom(uid, mine.data(), true), place: null });
      }
      return out;
    },
    async addFriend(input) {
      const code = normalizeCode(input);
      if (!code) return { ok: false, error: 'bad_code' };
      const uid = st.user?.uid;
      if (!uid) return { ok: false, error: 'offline' };
      try {
        const c = await getDoc(doc(db, 'codes', code));
        if (!c.exists()) return { ok: false, error: 'not_found' };
        const fid = c.data().uid;
        if (fid === uid) return { ok: false, error: 'self' };
        if ((st.profile?.friends || []).includes(fid)) return { ok: false, error: 'already' };
        await updateDoc(doc(db, 'players', uid), { friends: arrayUnion(fid) });
        st.profile = { ...(st.profile || {}), friends: [...(st.profile?.friends || []), fid] };
        const f = await getDoc(doc(db, 'players', fid));
        return { ok: true, friend: f.exists() ? rowFrom(fid, f.data(), false) : null };
      } catch (e) { return { ok: false, error: e.code || e.message }; }
    },
    async removeFriend(fid) {
      const uid = st.user?.uid;
      if (!uid) return;
      await updateDoc(doc(db, 'players', uid), { friends: arrayRemove(fid) });
      st.profile = { ...(st.profile || {}), friends: (st.profile?.friends || []).filter((x) => x !== fid) };
    },
  };

  // Kun for testing mot emulatoren: logg inn med en falsk Facebook/Apple-konto uten popup.
  if (cfg.emulator && typeof window !== 'undefined') {
    window.__ohioEmu = {
      async link(name, claims) {
        const token = JSON.stringify(claims);
        const cred = name === 'apple' ? new OAuthProvider('apple.com').credential({ idToken: token }) : FacebookAuthProvider.credential(token);
        try { await linkWithCredential(auth.currentUser, cred); } catch (e) {
          if (e.code === 'auth/credential-already-in-use' || e.code === 'auth/email-already-in-use') await switchToExisting(name, e, cred);
          else throw e;
        }
        await afterSignIn(api);
        return api.state();
      },
      uid: () => auth.currentUser && auth.currentUser.uid,
    };
  }
  return api;
}

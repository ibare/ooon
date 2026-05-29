import { lazy, Suspense, useEffect, useRef } from 'react';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import Footer from './layout/Footer';
import Nav from './layout/Nav';
// Home 은 메인(/) 라우트라 LCP 우선순위 위해 direct import. 나머지는 lazy.
import Home from './pages/Home';
import { LangProvider } from './i18n/context';
import { detectLanguage } from './i18n/detect';
import type { Lang } from './i18n/types';

const GetStarted = lazy(() => import('./pages/GetStarted'));
const Showcase = lazy(() => import('./pages/Showcase'));
const Syntax = lazy(() => import('./pages/Syntax'));
const Playground = lazy(() => import('./pages/Playground'));

function LangRoot() {
  return <Navigate to={`/${detectLanguage()}/`} replace />;
}

function ScrollToTop(): null {
  const { pathname } = useLocation();
  const prevBase = useRef('');
  useEffect(() => {
    const segments = pathname.split('/').filter(Boolean);
    const base = segments.slice(0, 2).join('/');
    if (base !== prevBase.current) {
      window.scrollTo(0, 0);
    }
    prevBase.current = base;
  }, [pathname]);
  return null;
}

function LangShell() {
  const { lang } = useParams<{ lang: string }>();
  const validLang: Lang = lang === 'ko' ? 'ko' : 'en';
  return (
    <LangProvider lang={validLang}>
      <ScrollToTop />
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Nav />
        <main style={{ flex: 1 }}>
          <Suspense fallback={<div style={{ padding: '4em', textAlign: 'center' }}>Loading…</div>}>
            <Routes>
              <Route index element={<Home />} />
              <Route path="get-started" element={<GetStarted />} />
              <Route path="get-started/:section" element={<GetStarted />} />
              <Route path="showcase" element={<Showcase />} />
              <Route path="showcase/:genre" element={<Showcase />} />
              <Route path="syntax" element={<Syntax />} />
              <Route path="syntax/:section" element={<Syntax />} />
              <Route path="playground" element={<Playground />} />
              <Route path="*" element={<Navigate to={`/${validLang}/`} replace />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </LangProvider>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LangRoot />} />
      <Route path="/:lang/*" element={<LangShell />} />
    </Routes>
  );
}

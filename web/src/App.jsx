/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React, { lazy, Suspense, useContext, useEffect, useMemo } from 'react';
import { Route, Routes, useLocation, useParams } from 'react-router-dom';
import Loading from './components/common/ui/Loading';
import User from './pages/User';
import LoginLog from './pages/LoginLog';
import { AuthRedirect, PrivateRoute, AdminRoute } from './helpers';
import RegisterForm from './components/auth/RegisterForm';
import LoginForm from './components/auth/LoginForm';
import NotFound from './pages/NotFound';
import Forbidden from './pages/Forbidden';
import Setting from './pages/Setting';
import { StatusContext } from './context/Status';

import PasswordResetForm from './components/auth/PasswordResetForm';
import PasswordResetConfirm from './components/auth/PasswordResetConfirm';
import Channel from './pages/Channel';
import Token from './pages/Token';
import Redemption from './pages/Redemption';
import TopUp from './pages/TopUp';
import Log from './pages/Log';
import Chat from './pages/Chat';
import Chat2Link from './pages/Chat2Link';
import Midjourney from './pages/Midjourney';
import Pricing from './pages/Pricing';
import Task from './pages/Task';
import ModelPage from './pages/Model';
import ModelDeploymentPage from './pages/ModelDeployment';
import Playground from './pages/Playground';
import Subscription from './pages/Subscription';
const Finance = lazy(() => import('./pages/Finance'));
import OAuth2Callback from './components/auth/OAuth2Callback';
import PersonalSetting from './components/settings/PersonalSetting';
import Setup from './pages/Setup';
import SetupCheck from './components/layout/SetupCheck';

const Home = lazy(() => import('./pages/Home'));
const HomeLanding = lazy(() => import('./pages/Home/HomeLanding'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const About = lazy(() => import('./pages/About'));
const Docs = lazy(() => import('./pages/Docs'));
const UserAgreement = lazy(() => import('./pages/UserAgreement'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const Security = lazy(() => import('./pages/Security'));
const Verifier = lazy(() => import('./pages/Verifier'));
const ChangelogPage = lazy(() => import('./pages/Changelog'));
const StatusPage = lazy(() => import('./pages/Status'));

const CurlGenerator = lazy(() => import('./pages/Tools/CurlGenerator'));
const LatencyTester = lazy(() => import('./pages/Tools/LatencyTester'));
const TokenCalculator = lazy(() => import('./pages/Tools/TokenCalculator'));
const BalanceChecker = lazy(() => import('./pages/Tools/BalanceChecker'));
const CacheCalculator = lazy(() => import('./pages/Tools/CacheCalculator'));
const PlansPage = lazy(() => import('./pages/Plans'));
const QuickStart = lazy(() => import('./pages/QuickStart'));
const RechargePage = lazy(() => import('./pages/Recharge'));
const TeamPage = lazy(() => import('./pages/Team'));
const TeamDetail = lazy(() => import('./pages/Team/TeamDetail'));
const JoinTeam = lazy(() => import('./pages/Team/JoinTeam'));
const GuideIndex = lazy(() => import('./pages/Guide'));
const GuidePrerequisites = lazy(() => import('./pages/Guide/Prerequisites'));
const GuideNodejsSetup = lazy(() => import('./pages/Guide/NodejsSetup'));
const GuideDetail = lazy(() => import('./pages/Guide/GuideDetail'));

// Shared shell for standalone tool pages — centered column, top padding,
// auto dark mode. Wraps CurlGenerator and LatencyTester.
const ToolPageShell = ({ children }) => (
  <div
    style={{
      minHeight: 'calc(100vh - var(--header-height))',
      background: 'var(--bg-base)',
      padding: '32px 24px',
    }}
  >
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>{children}</div>
  </div>
);

function DynamicOAuth2Callback() {
  const { provider } = useParams();
  return <OAuth2Callback type={provider} />;
}

function App() {
  const location = useLocation();
  const [statusState] = useContext(StatusContext);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // 获取模型广场权限配置
  const pricingRequireAuth = useMemo(() => {
    const headerNavModulesConfig = statusState?.status?.HeaderNavModules;
    if (headerNavModulesConfig) {
      try {
        const modules = JSON.parse(headerNavModulesConfig);

        // 处理向后兼容性：如果pricing是boolean，默认不需要登录
        if (typeof modules.pricing === 'boolean') {
          return false; // 默认不需要登录鉴权
        }

        // 如果是对象格式，使用requireAuth配置
        return modules.pricing?.requireAuth === true;
      } catch (error) {
        console.error('解析顶栏模块配置失败:', error);
        return false; // 默认不需要登录
      }
    }
    return false; // 默认不需要登录
  }, [statusState?.status?.HeaderNavModules]);

  return (
    <SetupCheck>
      <div key={location.pathname} className='mv-fade-in'>
      <Routes>
        <Route
          path='/'
          element={
            <Suspense fallback={<Loading></Loading>} key={location.pathname}>
              <HomeLanding />
            </Suspense>
          }
        />
        <Route
          path='/home-old'
          element={
            <Suspense fallback={<Loading></Loading>} key={location.pathname}>
              <Home />
            </Suspense>
          }
        />
        <Route
          path='/setup'
          element={
            <Suspense fallback={<Loading></Loading>} key={location.pathname}>
              <Setup />
            </Suspense>
          }
        />
        <Route path='/forbidden' element={<Forbidden />} />
        <Route
          path='/console/models'
          element={
            <AdminRoute>
              <ModelPage />
            </AdminRoute>
          }
        />
        <Route
          path='/console/deployment'
          element={
            <AdminRoute>
              <ModelDeploymentPage />
            </AdminRoute>
          }
        />
        <Route
          path='/console/subscription'
          element={
            <AdminRoute>
              <Subscription />
            </AdminRoute>
          }
        />
        <Route
          path='/console/channel'
          element={
            <AdminRoute>
              <Channel />
            </AdminRoute>
          }
        />
        <Route
          path='/console/finance'
          element={
            <Suspense fallback={<Loading />}>
              <AdminRoute>
                <Finance />
              </AdminRoute>
            </Suspense>
          }
        />
        <Route
          path='/console/token'
          element={
            <PrivateRoute>
              <Token />
            </PrivateRoute>
          }
        />
        <Route
          path='/console/playground'
          element={
            <PrivateRoute>
              <Playground />
            </PrivateRoute>
          }
        />
        <Route
          path='/console/redemption'
          element={
            <AdminRoute>
              <Redemption />
            </AdminRoute>
          }
        />
        <Route
          path='/console/user'
          element={
            <AdminRoute>
              <User />
            </AdminRoute>
          }
        />
        <Route
          path='/console/login-log'
          element={
            <AdminRoute>
              <LoginLog />
            </AdminRoute>
          }
        />
        <Route
          path='/user/reset'
          element={
            <Suspense fallback={<Loading></Loading>} key={location.pathname}>
              <PasswordResetConfirm />
            </Suspense>
          }
        />
        <Route
          path='/login'
          element={
            <Suspense fallback={<Loading></Loading>} key={location.pathname}>
              <AuthRedirect>
                <LoginForm />
              </AuthRedirect>
            </Suspense>
          }
        />
        <Route
          path='/register'
          element={
            <Suspense fallback={<Loading></Loading>} key={location.pathname}>
              <AuthRedirect>
                <RegisterForm />
              </AuthRedirect>
            </Suspense>
          }
        />
        <Route
          path='/reset'
          element={
            <Suspense fallback={<Loading></Loading>} key={location.pathname}>
              <PasswordResetForm />
            </Suspense>
          }
        />
        <Route
          path='/oauth/github'
          element={
            <Suspense fallback={<Loading></Loading>} key={location.pathname}>
              <OAuth2Callback type='github'></OAuth2Callback>
            </Suspense>
          }
        />
        <Route
          path='/oauth/discord'
          element={
            <Suspense fallback={<Loading></Loading>} key={location.pathname}>
              <OAuth2Callback type='discord'></OAuth2Callback>
            </Suspense>
          }
        />
        <Route
          path='/oauth/oidc'
          element={
            <Suspense fallback={<Loading></Loading>}>
              <OAuth2Callback type='oidc'></OAuth2Callback>
            </Suspense>
          }
        />
        <Route
          path='/oauth/linuxdo'
          element={
            <Suspense fallback={<Loading></Loading>} key={location.pathname}>
              <OAuth2Callback type='linuxdo'></OAuth2Callback>
            </Suspense>
          }
        />
        <Route
          path='/oauth/:provider'
          element={
            <Suspense fallback={<Loading></Loading>} key={location.pathname}>
              <DynamicOAuth2Callback />
            </Suspense>
          }
        />
        <Route
          path='/console/setting'
          element={
            <AdminRoute>
              <Suspense fallback={<Loading></Loading>} key={location.pathname}>
                <Setting />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path='/console/personal'
          element={
            <PrivateRoute>
              <Suspense fallback={<Loading></Loading>} key={location.pathname}>
                <PersonalSetting />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path='/console/topup'
          element={
            <PrivateRoute>
              <Suspense fallback={<Loading></Loading>} key={location.pathname}>
                <TopUp />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path='/console/recharge'
          element={
            <PrivateRoute>
              <Suspense fallback={<Loading></Loading>} key={location.pathname}>
                <RechargePage />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path='/console/team'
          element={
            <PrivateRoute>
              <Suspense fallback={<Loading></Loading>} key={location.pathname}>
                <TeamPage />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path='/console/team/join/:code'
          element={
            <PrivateRoute>
              <Suspense fallback={<Loading></Loading>} key={location.pathname}>
                <JoinTeam />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path='/console/team/:id'
          element={
            <PrivateRoute>
              <Suspense fallback={<Loading></Loading>} key={location.pathname}>
                <TeamDetail />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path='/console/log'
          element={
            <PrivateRoute>
              <Log />
            </PrivateRoute>
          }
        />
        <Route
          path='/console'
          element={
            <PrivateRoute>
              <Suspense fallback={<Loading></Loading>} key={location.pathname}>
                <Dashboard />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path='/console/midjourney'
          element={
            <PrivateRoute>
              <Suspense fallback={<Loading></Loading>} key={location.pathname}>
                <Midjourney />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path='/console/task'
          element={
            <PrivateRoute>
              <Suspense fallback={<Loading></Loading>} key={location.pathname}>
                <Task />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path='/pricing'
          element={
            pricingRequireAuth ? (
              <PrivateRoute>
                <Suspense
                  fallback={<Loading></Loading>}
                  key={location.pathname}
                >
                  <Pricing />
                </Suspense>
              </PrivateRoute>
            ) : (
              <Suspense fallback={<Loading></Loading>} key={location.pathname}>
                <Pricing />
              </Suspense>
            )
          }
        />
        <Route
          path='/plans'
          element={
            <Suspense fallback={<Loading></Loading>} key={location.pathname}>
              <PlansPage />
            </Suspense>
          }
        />
        <Route
          path='/quick-start'
          element={
            <PrivateRoute>
              <Suspense fallback={<Loading></Loading>} key={location.pathname}>
                <QuickStart />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route
          path='/about'
          element={
            <Suspense fallback={<Loading></Loading>} key={location.pathname}>
              <About />
            </Suspense>
          }
        />
        <Route
          path='/guide'
          element={
            <Suspense fallback={<Loading></Loading>} key={location.pathname}>
              <GuideIndex />
            </Suspense>
          }
        />
        <Route
          path='/guide/prerequisites'
          element={
            <Suspense fallback={<Loading></Loading>} key={location.pathname}>
              <GuidePrerequisites />
            </Suspense>
          }
        />
        <Route
          path='/guide/nodejs-setup'
          element={
            <Suspense fallback={<Loading></Loading>} key={location.pathname}>
              <GuideNodejsSetup />
            </Suspense>
          }
        />
        <Route
          path='/guide/:categoryId'
          element={
            <Suspense fallback={<Loading></Loading>} key={location.pathname}>
              <GuideDetail />
            </Suspense>
          }
        />
        <Route
          path='/docs'
          element={
            <Suspense fallback={<Loading></Loading>} key={location.pathname}>
              <Docs />
            </Suspense>
          }
        />
        <Route
          path='/docs/*'
          element={
            <Suspense fallback={<Loading></Loading>} key={location.pathname}>
              <Docs />
            </Suspense>
          }
        />
        <Route
          path='/user-agreement'
          element={
            <Suspense fallback={<Loading></Loading>} key={location.pathname}>
              <UserAgreement />
            </Suspense>
          }
        />
        <Route
          path='/privacy-policy'
          element={
            <Suspense fallback={<Loading></Loading>} key={location.pathname}>
              <PrivacyPolicy />
            </Suspense>
          }
        />
        <Route
          path='/terms-of-service'
          element={
            <Suspense fallback={<Loading></Loading>} key={location.pathname}>
              <TermsOfService />
            </Suspense>
          }
        />
        <Route
          path='/verifier'
          element={
            <Suspense fallback={<Loading></Loading>} key={location.pathname}>
              <Verifier />
            </Suspense>
          }
        />
        <Route
          path='/tools/curl'
          element={
            <Suspense fallback={<Loading></Loading>} key={location.pathname}>
              <ToolPageShell>
                <CurlGenerator />
              </ToolPageShell>
            </Suspense>
          }
        />
        <Route
          path='/tools/latency'
          element={
            <Suspense fallback={<Loading></Loading>} key={location.pathname}>
              <ToolPageShell>
                <LatencyTester />
              </ToolPageShell>
            </Suspense>
          }
        />
        <Route
          path='/tools/tokens'
          element={
            <Suspense fallback={<Loading></Loading>} key={location.pathname}>
              <ToolPageShell>
                <TokenCalculator />
              </ToolPageShell>
            </Suspense>
          }
        />
        <Route
          path='/tools/cache'
          element={
            <Suspense fallback={<Loading></Loading>} key={location.pathname}>
              <ToolPageShell>
                <CacheCalculator />
              </ToolPageShell>
            </Suspense>
          }
        />
        <Route
          path='/tools/balance'
          element={
            <Suspense fallback={<Loading></Loading>} key={location.pathname}>
              <ToolPageShell>
                <BalanceChecker />
              </ToolPageShell>
            </Suspense>
          }
        />
        <Route
          path='/changelog'
          element={
            <Suspense fallback={<Loading></Loading>} key={location.pathname}>
              <ChangelogPage />
            </Suspense>
          }
        />
        <Route
          path='/status'
          element={
            <Suspense fallback={<Loading></Loading>} key={location.pathname}>
              <StatusPage />
            </Suspense>
          }
        />
        <Route
          path='/security'
          element={
            <Suspense fallback={<Loading></Loading>} key={location.pathname}>
              <Security />
            </Suspense>
          }
        />
        <Route
          path='/console/chat/:id?'
          element={
            <Suspense fallback={<Loading></Loading>} key={location.pathname}>
              <Chat />
            </Suspense>
          }
        />
        {/* 方便使用chat2link直接跳转聊天... */}
        <Route
          path='/chat2link'
          element={
            <PrivateRoute>
              <Suspense fallback={<Loading></Loading>} key={location.pathname}>
                <Chat2Link />
              </Suspense>
            </PrivateRoute>
          }
        />
        <Route path='*' element={<NotFound />} />
      </Routes>
      </div>
    </SetupCheck>
  );
}

export default App;

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import '@fontsource/mulish/400.css';
import '@fontsource/mulish/600.css';
import '@fontsource/mulish/700.css';
import '@fontsource/source-sans-3/400.css';
import '@fontsource/source-sans-3/600.css';
import './styles/base.css';
import { StoreProvider } from './lib/store';
import { AppShell } from './app/AppShell';
import { Home } from './app/screens/Home';
import { Recipes } from './app/screens/Recipes';
import { RecipeDetail } from './app/screens/RecipeDetail';
import { RecipeForm } from './app/screens/RecipeForm';
import { Settings } from './app/screens/Settings';
import { Week } from './app/screens/Week';
import { ShoppingList } from './app/screens/ShoppingList';
import { SiteLayout } from './site/SiteLayout';
import { Landing } from './site/Landing';
import { SystemPage } from './site/SystemPage';
import { MarkdownPage } from './site/MarkdownPage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <HashRouter>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route index element={<Landing />} />
            <Route path="system" element={<SystemPage />} />
            <Route path="thinking" element={<MarkdownPage doc="thinking" toc />} />
            <Route path="status" element={<MarkdownPage doc="status" toc />} />
            {/* Old name of the Status page; kept so earlier links still land. */}
            <Route path="proof" element={<Navigate to="/status" replace />} />
          </Route>
          <Route path="app" element={<AppShell />}>
            <Route index element={<Home />} />
            <Route path="recipes" element={<Recipes />} />
            <Route path="recipes/new" element={<RecipeForm />} />
            <Route path="recipes/:id" element={<RecipeDetail />} />
            <Route path="recipes/:id/edit" element={<RecipeForm />} />
            <Route path="week" element={<Week />} />
            <Route path="list" element={<ShoppingList />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </HashRouter>
    </StoreProvider>
  </StrictMode>,
);

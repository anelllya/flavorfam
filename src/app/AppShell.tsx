import { Outlet } from 'react-router-dom';
import { BottomTabs, SnackbarProvider, TabBarProvider } from '../components';
import { useTheme } from '../lib/theme';
import s from './AppShell.module.css';

export function AppShell() {
  useTheme();
  // Screens put their own actions (Add to week, Save...) in the tab bar's top row via <TabBarActions>.
  return (
    <SnackbarProvider>
      <TabBarProvider>
        <div className={s.shell}>
          <div className={s.content}><Outlet /></div>
          <BottomTabs />
        </div>
      </TabBarProvider>
    </SnackbarProvider>
  );
}

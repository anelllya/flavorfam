import { ButtonLink, SectionHeader } from '../components';
import { t } from '../i18n';
import { Loop } from './Loop';
import status from './eval-status.json';
import s from './Site.module.css';

interface Check { name: string; pass: boolean }
const gate = status as { ranAt: string | null; checks: Check[] };

export function Landing() {
  return (
    <main className={s.landing}>
      <div className={s.stage}>
        <div className={s.phone}>
          <iframe className={s.frame} src={`${import.meta.env.BASE_URL}#/app`} title={t('site.phone')} />
        </div>
      </div>
      <div className={s.intro}>
        <div className={s.stack}>
          <p className={s.eyebrow}>{t('site.eyebrow')}</p>
          <h1 className={s.title}>{t('site.title')}</h1>
          <p className={s.lede}>{t('site.lede')}</p>
          <div className={s.ctas}>
            <ButtonLink to="/thinking">{t('site.cta.thinking')}</ButtonLink>
            <ButtonLink to="/status" variant="secondary">{t('site.cta.status')}</ButtonLink>
          </div>
          <section className={s.stack} aria-labelledby="loop">
            <SectionHeader title={t('site.loop.title')} id="loop" />
            <Loop />
          </section>
          {gate.ranAt && (
            <section className={s.stack} aria-labelledby="gate">
              <SectionHeader title={t('site.gate.title')} id="gate" />
              <ul className={s.gate}>
                {gate.checks.map((c) => (
                  <li key={c.name} className={s.check}>
                    <span>{c.name}</span>
                    <span className={c.pass ? s.pass : s.fail}>{t(c.pass ? 'site.gate.pass' : 'site.gate.fail')}</span>
                  </li>
                ))}
              </ul>
              <p className={s.muted}>{t('site.gate.when', { date: new Date(gate.ranAt).toUTCString() })}</p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

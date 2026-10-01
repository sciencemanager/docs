import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type Action = {label: string; to: string; variant?: 'primary' | 'secondary'};

export function Hero({
  title,
  tagline,
  actions,
}: {
  title: string;
  tagline: string;
  actions: Action[];
}): ReactNode {
  return (
    <div className={styles.hero}>
      <Heading as="h1" className={styles.heroTitle}>
        {title}
      </Heading>
      <p className={styles.heroTagline}>{tagline}</p>
      <div className={styles.actions}>
        {actions.map(({label, to, variant = 'primary'}) => (
          <Link
            key={to}
            className={`button button--lg ${
              variant === 'primary' ? 'button--primary' : 'button--outline button--secondary'
            }`}
            to={to}>
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export type Feature = {icon: string; title: string; text: string; to: string};

export function Features({items}: {items: Feature[]}): ReactNode {
  return (
    <section className={styles.grid}>
      {items.map(({icon, title, text, to}) => (
        <Link key={to} to={to} className={styles.card}>
          <span className={styles.icon} aria-hidden="true">
            {icon}
          </span>
          <Heading as="h3">{title}</Heading>
          <p>{text}</p>
        </Link>
      ))}
    </section>
  );
}

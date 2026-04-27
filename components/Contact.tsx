'use client';

import { useState, type FormEvent } from 'react';

interface Status { kind: '' | 'ok'; text: string }

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [status, setStatus] = useState<Status>({ kind: '', text: '' });

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !msg.trim()) {
      setStatus({ kind: '', text: 'Please fill every field.' });
      return;
    }
    const subject = encodeURIComponent(`Hello from ${name}`);
    const body = encodeURIComponent(`${msg}\n\n— ${name}\n${email}`);
    window.location.href = `mailto:raymondting521@gmail.com?subject=${subject}&body=${body}`;
    setStatus({ kind: 'ok', text: 'Opening your mail client…' });
  };

  return (
    <section
      className="section"
      id="contact"
      aria-labelledby="contact-title"
      data-screen-label="Contact"
    >
      <div className="shell">
        <div className="section-meta" aria-hidden="true">
          <span className="num">07</span>
          <span>Contact</span>
          <span className="bar" />
          <span>open to conversations</span>
        </div>
        <h2 className="section-title" id="contact-title">
          Let&apos;s talk shipping.
        </h2>
        <p className="section-lede">
          Building a CMS-driven platform, modernising legacy infrastructure, or looking for
          a senior who can own end-to-end delivery? Reach me directly.
        </p>

        <div className="contact-grid">
          <div>
            <ul className="contact-info" aria-label="Contact details">
              <li className="contact-row">
                <span className="lbl">Email</span>
                <a href="mailto:raymondting521@gmail.com">raymondting521@gmail.com</a>
              </li>
              <li className="contact-row">
                <span className="lbl">Phone</span>
                <a href="tel:+6591125475">+65 9112 5475</a>
              </li>

              <li className="contact-row">
                <span className="lbl">Status</span>
                <span className="val" style={{ color: 'var(--accent)' }}>
                  Open to conversations
                </span>
              </li>
            </ul>

            <a className="resume-cta" href="/resume.pdf" download>
              <span className="arrow" aria-hidden="true">↓</span>
              <span>Download résumé (PDF)</span>
            </a>
          </div>

          <form className="contact-form" onSubmit={onSubmit} noValidate>
            <div className="field">
              <label htmlFor="c-name">Name</label>
              <input id="c-name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="c-email">Email</label>
              <input id="c-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="c-msg">Message</label>
              <textarea id="c-msg" rows={5} value={msg} onChange={(e) => setMsg(e.target.value)} required />
            </div>
            <button type="submit" className="submit">Send message →</button>
            <div className={'status' + (status.kind ? ' ' + status.kind : '')} aria-live="polite">
              {status.text}
            </div>
          </form>
        </div>
      </div>
      <footer className="foot shell" role="contentinfo">
        <div>© 2026 · Raymond Ting</div>
        <address style={{ fontStyle: 'normal' }}>
          <a href="mailto:raymondting521@gmail.com">raymondting521@gmail.com</a>
          &nbsp;·&nbsp; <a href="tel:+6591125475">+65 9112 5475</a>
        </address>
      </footer>
    </section>
  );
}

import Script from 'next/script';

// Google Tag Manager container (e.g. GTM-XXXXXXX), set in Netlify env / .env.local. When set, GA4 is expected to be
// configured inside GTM and the direct gtag.js snippet below is not loaded (avoids double page views).
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const GA_ID = 'G-JJ5YG883HM';

// Shared by every root layout (city + roots). The noscript iframe goes first in <body>, the scripts after the content.
export function AnalyticsNoScript() {
  if (!GTM_ID) return null;
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  );
}

export default function Analytics() {
  return GTM_ID ? (
    <Script id="google-tag-manager" strategy="afterInteractive">
      {`
        window.__GTM__ = true;
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
        var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
        j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${GTM_ID}');
      `}
    </Script>
  ) : (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}

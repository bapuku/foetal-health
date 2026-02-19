import Image from 'next/image';

interface PageBannerProps {
  src: string;
  alt: string;
  title: string;
  subtitle?: string;
}

export default function PageBanner({ src, alt, title, subtitle }: PageBannerProps) {
  return (
    <div className="page-banner">
      <Image src={src} alt={alt} fill className="object-cover" sizes="100vw" priority={false} />
      <div className="page-banner-overlay" />
      <div className="page-banner-content">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-200 md:text-base">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

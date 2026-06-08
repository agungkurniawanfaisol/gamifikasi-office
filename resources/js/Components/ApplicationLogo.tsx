import { ImgHTMLAttributes } from 'react';

/** Served from `public/images/logo.png` (not bundled by Vite — deploy that file with `public/`). */
export default function ApplicationLogo(props: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            {...props}
            src="/images/logo.png"
            alt="DeepTest - UNIPDA"
        />
    );
}

import React, { useState, useEffect, useRef } from "react";

export interface QrConfig {
 dotsOptions: {
 type: 'square' | 'dots' | 'rounded' | 'classy' | 'classy-rounded' | 'extra-rounded';
 color: string;
 };
 cornersSquareOptions: {
 type: 'square' | 'dot' | 'extra-rounded';
 color: string;
 };
 cornersDotOptions: {
 type: 'square' | 'dot';
 color: string;
 };
 backgroundOptions: {
 color: string;
 };
 imageOptions: {
 hideBackgroundDots: boolean;
 imageSize: number;
 margin: number;
 };
}

export const DynamicQR = React.memo(({ data, config, size = 200, logo }: { data: string, config: QrConfig, size?: number, logo?: string | null }) => {
 const ref = useRef<HTMLDivElement>(null);
 const [QRCodeStyling, setQRCodeStyling] = useState<any>(null);
 const instance = useRef<any>(null);
 const [debouncedData, setDebouncedData] = useState(data);

 // Debounce data to avoid heavy re-renders during typing
 useEffect(() => {
 const handler = setTimeout(() => {
 setDebouncedData(data);
 }, 300);
 return () => clearTimeout(handler);
 }, [data]);

 useEffect(() => {
 import("qr-code-styling").then((mod) => setQRCodeStyling(() => mod.default));
 }, []);

 const options = React.useMemo(() => ({
 width: size,
 height: size,
 data: debouncedData || " ",
 image: logo || undefined,
 dotsOptions: config.dotsOptions,
 cornersSquareOptions: config.cornersSquareOptions,
 cornersDotOptions: config.cornersDotOptions,
 backgroundOptions: config.backgroundOptions,
 imageOptions: {
 hideBackgroundDots: config.imageOptions?.hideBackgroundDots ?? true,
 imageSize: config.imageOptions?.imageSize ?? 0.4,
 margin: config.imageOptions?.margin ?? 0,
 crossOrigin: 'anonymous'
 }
 }), [size, debouncedData, logo, config]);

 useEffect(() => {
 if (!QRCodeStyling || !ref.current) return;

 if (!instance.current) {
 instance.current = new QRCodeStyling(options);
 ref.current.innerHTML = "";
 instance.current.append(ref.current);
 } else {
 instance.current.update(options);
 }
 }, [QRCodeStyling, options]);

 return (
 <div ref={ref} className="[&>canvas]:max-w-full [&>canvas]:h-auto flex items-center justify-center transition-all duration-300" />
 );
});
DynamicQR.displayName = "DynamicQR";

export const QR_TEMPLATES = [
 { name: 'Classic', config: { dotsOptions: { type: 'square' as const, color: '#000000' }, cornersSquareOptions: { type: 'square' as const, color: '#000000' }, cornersDotOptions: { type: 'square' as const, color: '#000000' }, backgroundOptions: { color: '#ffffff' }, imageOptions: { hideBackgroundDots: true, imageSize: 0.4, margin: 0 } } },
 { name: 'Easy', config: { dotsOptions: { type: 'rounded' as const, color: '#4f46e5' }, cornersSquareOptions: { type: 'extra-rounded' as const, color: '#4f46e5' }, cornersDotOptions: { type: 'dot' as const, color: '#4f46e5' }, backgroundOptions: { color: '#ffffff' }, imageOptions: { hideBackgroundDots: true, imageSize: 0.4, margin: 0 } } },
 { name: 'Jungle', config: { dotsOptions: { type: 'dots' as const, color: '#059669' }, cornersSquareOptions: { type: 'extra-rounded' as const, color: '#059669' }, cornersDotOptions: { type: 'dot' as const, color: '#059669' }, backgroundOptions: { color: '#ffffff' }, imageOptions: { hideBackgroundDots: true, imageSize: 0.4, margin: 0 } } },
 { name: 'Rain', config: { dotsOptions: { type: 'classy' as const, color: '#2563eb' }, cornersSquareOptions: { type: 'square' as const, color: '#2563eb' }, cornersDotOptions: { type: 'square' as const, color: '#2563eb' }, backgroundOptions: { color: '#ffffff' }, imageOptions: { hideBackgroundDots: true, imageSize: 0.4, margin: 0 } } },
 { name: 'Mosaic', config: { dotsOptions: { type: 'classy-rounded' as const, color: '#7c3aed' }, cornersSquareOptions: { type: 'extra-rounded' as const, color: '#7c3aed' }, cornersDotOptions: { type: 'dot' as const, color: '#7c3aed' }, backgroundOptions: { color: '#ffffff' }, imageOptions: { hideBackgroundDots: true, imageSize: 0.4, margin: 0 } } },
 { name: 'Ninja', config: { dotsOptions: { type: 'extra-rounded' as const, color: '#dc2626' }, cornersSquareOptions: { type: 'dot' as const, color: '#dc2626' }, cornersDotOptions: { type: 'dot' as const, color: '#dc2626' }, backgroundOptions: { color: '#ffffff' }, imageOptions: { hideBackgroundDots: true, imageSize: 0.4, margin: 0 } } },
];

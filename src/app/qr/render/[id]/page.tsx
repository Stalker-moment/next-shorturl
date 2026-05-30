"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";

// Reuse the DynamicQR logic but for public viewing
function DynamicQR({ data, config, size = 300, logo }: { data: string, config: any, size?: number, logo?: string | null }) {
    const ref = useRef<HTMLDivElement>(null);
    const [QRCodeStyling, setQRCodeStyling] = useState<any>(null);
    const instance = useRef<any>(null);

    useEffect(() => {
        import("qr-code-styling").then((mod) => setQRCodeStyling(() => mod.default));
    }, []);

    useEffect(() => {
        if (!QRCodeStyling || !ref.current) return;
        
        instance.current = new QRCodeStyling({
            width: size,
            height: size,
            data: data || " ",
            image: logo || undefined,
            dotsOptions: config.dotsOptions,
            cornersSquareOptions: config.cornersSquareOptions,
            cornersDotOptions: config.cornersDotOptions,
            backgroundOptions: {
                ...config.backgroundOptions,
                color: 'transparent'
            },
            imageOptions: {
                hideBackgroundDots: config.imageOptions.hideBackgroundDots,
                imageSize: config.imageOptions.imageSize,
                margin: config.imageOptions.margin,
                crossOrigin: 'anonymous'
            }
        });

        ref.current.innerHTML = "";
        instance.current.append(ref.current);
    }, [QRCodeStyling, data, config, size, logo]);

    return (
        <div ref={ref} className="[&>canvas]:max-w-full [&>canvas]:h-auto flex items-center justify-center" />
    );
}

function QrRenderContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const id = params.id as string;
    const [qrData, setQrData] = useState<any>(null);
    const [error, setError] = useState(false);

    // Get Embed customization from URL params
    const bgParam = searchParams.get('bg');
    const bg = bgParam ? (bgParam === 'transparent' ? 'transparent' : `#${bgParam}`) : 'transparent';
    const padding = searchParams.get('padding') || '0';
    const radius = searchParams.get('radius') || '0';

    useEffect(() => {
        if (!id) return;
        fetch(`/api/public/qrcodes/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) setQrData(data.data);
                else setError(true);
            })
            .catch(() => setError(true));
    }, [id]);

    if (error) return <div className="text-red-500 p-4 font-bold text-center">QR Render: Not found.</div>;
    if (!qrData) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    const style = qrData.styleConfig ? (typeof qrData.styleConfig === 'string' ? JSON.parse(qrData.styleConfig) : qrData.styleConfig) : {
        dotsOptions: { type: 'square', color: '#000000' },
        cornersSquareOptions: { type: 'square', color: '#000000' },
        cornersDotOptions: { type: 'square', color: '#000000' },
        backgroundOptions: { color: '#ffffff' },
        imageOptions: { hideBackgroundDots: true, imageSize: 0.4, margin: 0 }
    };

    const hostname = window.location.host;
    const protocol = window.location.protocol;
    const fullUrl = `${protocol}//${hostname}/${qrData.qrShortUrl}`;

    return (
        <div 
            style={{ 
                backgroundColor: bg, 
                padding: `${padding}px`, 
                borderRadius: `${radius}px`,
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease'
            }}
        >
            <DynamicQR 
                data={fullUrl}
                config={style}
                logo={qrData.logo}
                size={350}
            />
        </div>
    );
}

export default function QrRenderPage() {
    return (
        <Suspense fallback={null}>
            <QrRenderContent />
        </Suspense>
    );
}

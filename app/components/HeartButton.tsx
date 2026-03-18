import { HeartIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import { ClientOnly } from "remix-utils";
import { t } from "~/utils";

export default function HeartButton({ playingVideoData, onHeartClick, hearted }: any) {
    const [clickedOnce, setClickedOnce] = useState(false);

    return <div className="w-6 h-6 relative">
        <HeartIcon
        className={
            'peer/hearticon text-neutral-300 cursor-pointer hover:brightness-150' 
            + t(hearted, 'opacity-0')
            + t(!hearted && clickedOnce, 'animate-wiggle-more animate-fill-backwards animate-duration-150')
        }
        onClick={() => {
            onHeartClick?.({ playingVideoData });
            setClickedOnce(true)
        }}/>

        {hearted &&
        <div className="overflow-hidden w-14 h-14 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
        -mt-0.5
        scale-125
        peer-hover/hearticon:brightness-150
        pointer-events-none
        "
        >
            <ClientOnly fallback={<div className="w-32 h-32" />}>
                {() => <HeartAnimation videoId={playingVideoData?.videoId} />}
            </ClientOnly>
        </div>}
    </div>
}

// Client-only component for Lottie animation
function HeartAnimation({ videoId }: { videoId: string }) {
    const lottieRef = useRef<any>();
    const [Lottie, setLottie] = useState<any>(null);
    const [heartAnimation, setHeartAnimation] = useState<any>(null);

    useEffect(() => {
        // Dynamic imports on client only
        Promise.all([
            import('lottie-react'),
            import('../../public/heart.json')
        ]).then(([lottieModule, animationModule]) => {
            setLottie(() => lottieModule.default);
            setHeartAnimation(animationModule.default);
        });
    }, []);

    useEffect(() => {
        if (lottieRef.current) {
            const frame = lottieRef.current.getDuration(true);
            lottieRef.current.goToAndStop(frame, true);
        }
    }, [videoId]);

    if (!Lottie || !heartAnimation) {
        return <div className="w-32 h-32" />;
    }

    return (
        <Lottie
            lottieRef={lottieRef}
            autoplay={true}
            loop={false}
            animationData={heartAnimation}
            className='w-32 h-32 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
        />
    );
}

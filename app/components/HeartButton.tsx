import { HeartIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import { t } from "~/utils";

// Dynamic import for Lottie to avoid SSR issues
const useLottie = () => {
    const [Lottie, setLottie] = useState<any>(null);
    const [heartAnimation, setHeartAnimation] = useState<any>(null);

    useEffect(() => {
        // Only import on client side
        if (typeof window !== 'undefined') {
            import('lottie-react').then((module) => setLottie(() => module.default));
            import('../../public/heart.json').then((module) => setHeartAnimation(module.default));
        }
    }, []);

    return { Lottie, heartAnimation };
};

export default function HeartButton({ playingVideoData, onHeartClick, hearted }: any) {
    const lottieRef = useRef<any>();
    const [clickedOnce, setClickedOnce] = useState(false);
    const { Lottie, heartAnimation } = useLottie();

    useEffect(() => {
        if (!hearted) {
            setClickedOnce(false)
            return
        }
        const frame = lottieRef.current?.getDuration(true);
        lottieRef.current?.goToAndStop(frame, true);
    },[playingVideoData.videoId])

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

        {hearted && Lottie && heartAnimation &&
        <div className="overflow-hidden w-14 h-14 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
        -mt-0.5
        scale-125
        peer-hover/hearticon:brightness-150
        pointer-events-none
        "
        >

            <Lottie
                lottieRef={lottieRef}
                autoplay={true}
                loop={false}
                animationData={heartAnimation}
                className='w-32 h-32 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                ' />

        </div>}
    </div>
}

import React, { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { SplitText as GSAPSplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(GSAPSplitText, useGSAP);

type SplitTextProps = {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string;
  splitType?: "chars" | "words" | "lines" | string;
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  textAlign?: "left" | "center" | "right" | "justify";
  tag?: "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  onLetterAnimationComplete?: () => void;
};

const SplitText = ({
  text,
  className = "",
  delay = 100,
  duration = 0.6,
  ease = "power3.out",
  splitType = "chars",
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  textAlign = "center",
  tag = "p",
  onLetterAnimationComplete,
}: SplitTextProps) => {
  const ref = useRef<HTMLElement>(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // تحميل الخطوط
  useEffect(() => {
    if (document.fonts.status === "loaded") {
      setFontsLoaded(true);
    } else {
      document.fonts.ready.then(() => {
        setFontsLoaded(true);
      });
    }
  }, []);

  useGSAP(
    () => {
      if (!ref.current || !text || !fontsLoaded) return;
      const el = ref.current as HTMLElement & {
        _rbsplitInstance?: GSAPSplitText;
      };

      // تنظيف أي split قديم
      if (el._rbsplitInstance) {
        try {
          el._rbsplitInstance.revert();
        } catch {
          /* noop */
        }
        el._rbsplitInstance = undefined;
      }

      let targets: HTMLElement[] = [];

      const splitInstance = new GSAPSplitText(el, {
        type: splitType,
        smartWrap: true,
        autoSplit: splitType === "lines",
        linesClass: "split-line",
        wordsClass: "split-word",
        charsClass: "split-char",
        reduceWhiteSpace: false,
        onSplit: (self) => {
          if (splitType.includes("chars") && self.chars.length)
            targets = self.chars as HTMLElement[];
          if (!targets.length && splitType.includes("words") && self.words.length)
            targets = self.words as HTMLElement[];
          if (!targets.length && splitType.includes("lines") && self.lines.length)
            targets = self.lines as HTMLElement[];
          if (!targets.length)
            targets = (self.chars || self.words || self.lines) as HTMLElement[];

          // Timeline يتكرر بنفس الأنيميشن
          const tl = gsap.timeline({
            repeat: -1,
            repeatDelay: 0.5,
          });

          tl.fromTo(
            targets,
            { ...from },
            {
              ...to,
              duration,
              ease,
              stagger: delay / 1000,
              willChange: "transform, opacity",
              force3D: true,
              onComplete: () => {
                onLetterAnimationComplete?.();
              },
            }
          );

          return tl;
        },
      });

      el._rbsplitInstance = splitInstance;

      return () => {
        try {
          splitInstance.revert();
        } catch {
          /* noop */
        }
        el._rbsplitInstance = undefined;
      };
    },
    {
      dependencies: [
        text,
        delay,
        duration,
        ease,
        splitType,
        JSON.stringify(from),
        JSON.stringify(to),
        fontsLoaded,
        onLetterAnimationComplete,
      ],
      scope: ref,
    }
  );

  const style: React.CSSProperties = {
    textAlign,
    overflow: "hidden",
    display: "inline-block",
    whiteSpace: "normal",
    wordWrap: "break-word",
    willChange: "transform, opacity",
    direction: "ltr", // Force LTR for brand names like "Family App"
    unicodeBidi: "embed", // Isolate text direction
  };
  const classes = `split-parent ${className}`;

  const Tag = tag as React.ElementType;

  return (
    <Tag ref={ref} style={style} className={classes}>
      {text}
    </Tag>
  );
};

export default SplitText;
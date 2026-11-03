import { Easing, FadeIn, FadeInDown, FadeInRight, FadeInUp, FadeOut, LinearTransition } from 'react-native-reanimated';

/**
 * Shared animation presets. Everything eases out on a fixed timeline — no springs — so nothing on
 * screen overshoots, bounces or wobbles before it settles.
 */
export const easeOut = Easing.out(Easing.cubic);
export const easeIn = Easing.in(Easing.cubic);

/** For withTiming() on shared values. */
export const timing = { duration: 220, easing: easeOut } as const;

export const motion = {
  /** Content rising a few pixels into place while fading in. */
  enter: (delay = 0) => FadeInDown.duration(260).delay(delay).easing(easeOut),
  enterUp: (delay = 0) => FadeInUp.duration(240).delay(delay).easing(easeOut),
  enterRight: (delay = 0) => FadeInRight.duration(260).delay(delay).easing(easeOut),
  fade: (delay = 0) => FadeIn.duration(200).delay(delay),
  fadeOut: FadeOut.duration(150),
  /** Smoothly moves siblings when a list item appears or disappears. */
  layout: LinearTransition.duration(220).easing(easeOut),
};

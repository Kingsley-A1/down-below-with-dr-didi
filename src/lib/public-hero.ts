export type PublicHeroTone =
  | 'home'
  | 'gallery'
  | 'podcast'
  | 'outreach'
  | 'events'
  | 'library'
  | 'about'
  | 'team'
  | 'contact'
  | 'vault'

const publicHeroGradients: Record<PublicHeroTone, string> = {
  home:
    'radial-gradient(58% 44% at 80% 18%, rgba(236,253,245,0.34) 0%, rgba(167,243,208,0.18) 34%, rgba(8,63,52,0) 72%), linear-gradient(135deg, #083f34 0%, #0d604f 42%, #0b5346 72%, #06362e 100%)',
  gallery:
    'radial-gradient(52% 42% at 86% 12%, rgba(255,255,255,0.30) 0%, rgba(187,247,208,0.18) 36%, rgba(8,63,52,0) 72%), linear-gradient(145deg, #074238 0%, #0b5949 48%, #07372f 100%)',
  podcast:
    'radial-gradient(46% 48% at 20% 8%, rgba(240,253,244,0.28) 0%, rgba(134,239,172,0.16) 42%, rgba(8,63,52,0) 76%), linear-gradient(135deg, #083d34 0%, #0d5749 50%, #062f29 100%)',
  outreach:
    'radial-gradient(48% 44% at 78% 20%, rgba(255,255,255,0.32) 0%, rgba(217,249,157,0.18) 38%, rgba(8,63,52,0) 74%), linear-gradient(140deg, #064137 0%, #0b604d 45%, #08382f 100%)',
  events:
    'radial-gradient(48% 44% at 50% 0%, rgba(236,253,245,0.32) 0%, rgba(110,231,183,0.15) 40%, rgba(8,63,52,0) 74%), linear-gradient(135deg, #073c33 0%, #0b5748 52%, #06342d 100%)',
  library:
    'radial-gradient(52% 48% at 18% 12%, rgba(255,255,255,0.30) 0%, rgba(187,247,208,0.16) 38%, rgba(8,63,52,0) 74%), linear-gradient(135deg, #083d34 0%, #0b5b4a 48%, #07362f 100%)',
  about:
    'radial-gradient(48% 44% at 84% 16%, rgba(236,253,245,0.34) 0%, rgba(190,242,100,0.14) 42%, rgba(8,63,52,0) 76%), linear-gradient(140deg, #073e35 0%, #0b594a 45%, #06352d 100%)',
  team:
    'radial-gradient(48% 44% at 16% 10%, rgba(255,255,255,0.30) 0%, rgba(134,239,172,0.15) 38%, rgba(8,63,52,0) 74%), linear-gradient(145deg, #083f35 0%, #0c5d4d 48%, #06362e 100%)',
  contact:
    'radial-gradient(48% 44% at 78% 18%, rgba(240,253,244,0.34) 0%, rgba(220,252,231,0.18) 38%, rgba(8,63,52,0) 72%), linear-gradient(135deg, #073e34 0%, #0b5848 50%, #06342c 100%)',
  vault:
    'radial-gradient(48% 44% at 50% 0%, rgba(255,255,255,0.32) 0%, rgba(187,247,208,0.17) 42%, rgba(8,63,52,0) 76%), linear-gradient(135deg, #083d34 0%, #0b5648 50%, #062f29 100%)',
}

export function publicHeroGradient(tone: PublicHeroTone) {
  return publicHeroGradients[tone]
}

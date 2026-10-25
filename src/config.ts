/**
 * The few things that change between releases, in one place.
 */
export const SITE = {
  /**
   * The waitlist form (Google Forms, Tally, Typeform or anything with a link). Until it is set,
   * the waitlist section says the list opens soon and points to new versions on GitHub instead.
   */
  waitlistUrl: '',
  /** Where new versions are posted. */
  releasesUrl: 'https://github.com/SohMeh/foto-site',
  download: {
    version: '0.1.0',
    href: './download/Foto-0.1.0-arm64.dmg',
    /** Size of the disk image in MB, shown next to the button. */
    sizeMb: 85,
  },
};

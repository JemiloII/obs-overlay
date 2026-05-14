export type TwitchGlyphProperties = {
  className?: string;
  title?: string;
};

export function TwitchGlyph({ className, title = "Twitch" }: TwitchGlyphProperties) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-label={title}
      role="img"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <path
        fill="currentColor"
        d="M4.265 0 1.2 3.064v17.872h5.515V24l3.064-3.064h4.485l8.272-8.272V0H4.265Zm17.227 11.66-4.83 4.83h-4.83l-3.064 3.064V16.49H3.69V1.838h17.802V11.66Z"
      />
      <path fill="currentColor" d="M16.48 5.514h-1.838v5.514h1.838V5.514Zm-5.058 0H9.583v5.514h1.84V5.514Z" />
    </svg>
  );
}

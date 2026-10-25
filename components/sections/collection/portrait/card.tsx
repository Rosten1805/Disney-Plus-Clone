import Image from "next/image";
import Link from "next/link";
import type { Media } from "../../../../types";

type Props = {
  media: Media;
  showTitle?: boolean;
};

const Card = ({ media, showTitle }: Props) => {
  return (
    <div>
      <Link
        href={`/${media.type}/${media.id}`}
        className="relative block aspect-[79/105] w-28 overflow-hidden rounded tablet:w-auto">
        <div className="absolute inset-0 animate-pulse bg-card-dark" />
        <Image
          src={`https://image.tmdb.org/t/p/w500${media.image.poster!}`}
          fill
          sizes="350px"
          alt={media.title!}
          className="transition-smooth object-cover hover:brightness-[130%]"
        />
      </Link>
      {showTitle ? (
        // [test/pipeline-full-green] Fixed: plain JSX text instead of
        // dangerouslySetInnerHTML — React escapes this by default, closing
        // the stored XSS described in SECURITY_NOTES.md. Not merged to
        // main — this branch only verifies the pipeline deploys when clean.
        <p className="mt-1 truncate text-xs font-semibold">{media.title}</p>
      ) : null}
    </div>
  );
};

export default Card;

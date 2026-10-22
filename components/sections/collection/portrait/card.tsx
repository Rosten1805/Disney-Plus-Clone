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
        /**
         * INTENTIONAL FLAW (kept on purpose for a DevSecOps/CI-CD pipeline
         * demo — see SECURITY_NOTES.md): stored XSS. `media.title` here
         * comes straight from the watchlist (`POST /api/watchlist` accepts
         * any client-supplied `title` string, no validation, stored as-is
         * in Postgres). Rendering it with `dangerouslySetInnerHTML` instead
         * of as plain JSX text means a title like
         * `<img src=x onerror=alert(document.cookie)>` persists and
         * executes every time this viewer's My List page renders.
         */
        <p
          className="mt-1 truncate text-xs font-semibold"
          dangerouslySetInnerHTML={{ __html: media.title! }}
        />
      ) : null}
    </div>
  );
};

export default Card;

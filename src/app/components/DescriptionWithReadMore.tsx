"use client";
import { FC, useState } from "react";

interface Props {
  description: string;
}

const MAX_LENGTH = 320;

const DescriptionWithReadMore: FC<Props> = ({ description }) => {
  const [expanded, setExpanded] = useState(false);
  const shouldTruncate = description.length > MAX_LENGTH;
  const displayed = expanded || !shouldTruncate
    ? description
    : description.slice(0, MAX_LENGTH) + "...";

  return (
    <div className="text-sm opacity-70 whitespace-pre-line">
      {displayed}
      {shouldTruncate && !expanded && (
        <button
          className="btn btn-link btn-xs px-1 align-baseline"
          onClick={() => setExpanded(true)}
        >
          Read More
        </button>
      )}
      {shouldTruncate && expanded && (
        <span
          className="underline cursor-pointer ml-1"
          onClick={() => setExpanded(false)}
        >
          Read Less
        </span>
      )}
    </div>
  );
};

export default DescriptionWithReadMore;

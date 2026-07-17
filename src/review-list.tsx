import type { Review } from "@particle-academy/fancy-git";

export interface ReviewListProps {
  value: Review[];
  selectedNumber?: number;
  onSelectedNumberChange?: (number: number) => void;
  className?: string;
}

export function ReviewList({ value, selectedNumber, onSelectedNumberChange, className }: ReviewListProps) {
  return <section className={className} data-git-review-list="" aria-label="Reviews"><ul>
    {value.map((review) => <li key={review.id} data-git-review-number={review.number}>
      <button type="button" aria-pressed={selectedNumber === review.number} onClick={() => onSelectedNumberChange?.(review.number)}>
        <strong>#{review.number} {review.title}</strong><span>{review.state}</span><small>{review.sourceBranch} → {review.targetBranch}</small>
      </button>
    </li>)}
  </ul></section>;
}

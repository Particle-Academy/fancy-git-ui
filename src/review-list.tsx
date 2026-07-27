import { Badge, Text } from "@particle-academy/react-fancy";
import type { Review } from "@particle-academy/fancy-git";
import { reviewStateColor } from "./status-color.js";

export interface ReviewListProps {
  value: Review[];
  selectedNumber?: number;
  onSelectedNumberChange?: (number: number) => void;
  className?: string;
}

/**
 * Pull / merge requests and their state.
 *
 * A list of selectable rows rather than a `<Table>`: `<Table>` earns its
 * complexity when there are columns to sort and compare, and a review row is
 * one title plus its state. Forcing it into a grid would add sortable headers
 * over data nobody sorts, and lose the whole-row click this surface is for.
 *
 * `<Badge>` does carry its weight — open / merged / closed / draft is exactly
 * the four-way status a badge exists for, and every forge already trains people
 * to read those colours.
 */
export function ReviewList({ value, selectedNumber, onSelectedNumberChange, className }: ReviewListProps) {
  return (
    <section className={className} data-git-review-list="" aria-label="Reviews">
      <ul>
        {value.map((review) => (
          <li
            key={review.id}
            data-git-review-number={review.number}
            data-selected={selectedNumber === review.number || undefined}
          >
            <button
              type="button"
              aria-pressed={selectedNumber === review.number}
              onClick={() => onSelectedNumberChange?.(review.number)}
            >
              <span data-git-review-head="">
                <Text size="sm" className="!font-medium">
                  #{review.number} {review.title}
                </Text>
                <Badge color={reviewStateColor(review.state)} variant="soft" size="sm">
                  {review.state}
                </Badge>
              </span>
              <Text size="xs" className="!text-zinc-500">
                <code>{review.sourceBranch}</code> → <code>{review.targetBranch}</code>
              </Text>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

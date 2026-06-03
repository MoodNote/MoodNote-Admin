import { cn } from "@/utils/cn";

/** Build a compact page list: 1 … 4 5 6 … 10 */
function buildPageNumbers(
	currentPage: number,
	totalPages: number,
): (number | "...")[] {
	if (totalPages <= 7) {
		return Array.from({ length: totalPages }, (_, i) => i + 1);
	}
	const pages: (number | "...")[] = [1];
	if (currentPage > 3) pages.push("...");
	for (
		let i = Math.max(2, currentPage - 1);
		i <= Math.min(totalPages - 1, currentPage + 1);
		i++
	) {
		pages.push(i);
	}
	if (currentPage < totalPages - 2) pages.push("...");
	pages.push(totalPages);
	return pages;
}

interface PaginationProps {
	page: number;
	totalPages: number;
	total: number;
	/** Plural noun for the total count, e.g. "users", "tracks". */
	itemLabel: string;
	onPageChange: (page: number) => void;
}

/** Shared, accessible pagination control used across list pages. */
export default function Pagination({
	page,
	totalPages,
	total,
	itemLabel,
	onPageChange,
}: PaginationProps) {
	if (totalPages <= 1) return null;
	const pageNumbers = buildPageNumbers(page, totalPages);

	return (
		<nav className="app-pagination" aria-label="Pagination">
			<button
				type="button"
				className="app-pagination__btn"
				disabled={page <= 1}
				onClick={() => onPageChange(page - 1)}
				aria-label="Previous page">
				←
			</button>

			{pageNumbers.map((p, idx) =>
				p === "..." ? (
					<span
						key={`ellipsis-${idx}`}
						className="app-pagination__ellipsis"
						aria-hidden="true">
						…
					</span>
				) : (
					<button
						key={p}
						type="button"
						className={cn(
							"app-pagination__btn",
							p === page && "app-pagination__btn--active",
						)}
						aria-current={p === page ? "page" : undefined}
						aria-label={`Page ${p}`}
						onClick={() => onPageChange(p)}>
						{p}
					</button>
				),
			)}

			<button
				type="button"
				className="app-pagination__btn"
				disabled={page >= totalPages}
				onClick={() => onPageChange(page + 1)}
				aria-label="Next page">
				→
			</button>

			<span className="app-pagination__info">
				{total.toLocaleString()} {itemLabel}
			</span>
		</nav>
	);
}

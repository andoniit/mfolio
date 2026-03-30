import Link from "next/link";

type Item = { id: string; name: string; slug: string };

type Props = {
  categories: Item[] | null | undefined;
  tags: Item[] | null | undefined;
  activeCategorySlug?: string | null;
  activeTagSlug?: string | null;
};

export default function BlogListingFilters({
  categories,
  tags,
  activeCategorySlug,
  activeTagSlug,
}: Props) {
  const showAllActive = !activeCategorySlug && !activeTagSlug;

  return (
    <>
      <div className="filter-group">
        <Link href="/blog" className={`filter-btn ${showAllActive ? "active" : ""}`}>
          All
        </Link>
        {categories?.map((category) => (
          <Link
            key={category.id}
            href={`/category/${category.slug}`}
            className={`filter-btn ${activeCategorySlug === category.slug ? "active" : ""}`}
          >
            {category.name}
          </Link>
        ))}
      </div>

      <div className="filter-group tag-filters">
        {tags?.map((tag) => (
          <Link
            key={tag.id}
            href={`/tag/${tag.slug}`}
            className={`filter-btn small ${activeTagSlug === tag.slug ? "active" : ""}`}
          >
            #{tag.name}
          </Link>
        ))}
      </div>
    </>
  );
}

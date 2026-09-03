"use client";
import "./filter-sidebar.css";

interface Category {
    id: number;
    name: string;
    type: string;
}

interface FilterSidebarProps {
    suffix: "desktop" | "mobile";
    categories: Category[];
    sizes: string[];
    selectedCategories: number[];
    selectedSizes: string[];
    openSections: Record<string, boolean>;
    values: [number, number];
    MIN: number;
    MAX: number;
    STEP: number;
    trackBackground: string;
    toggleSection: (section: string) => void;
    toggleCategory: (id: number, checked: boolean) => void;
    toggleSize: (size: string, checked: boolean) => void;
    onMinInput: (value: string) => void;
    onMaxInput: (value: string) => void;
    resetFilters: () => void;
}

export default function FilterSidebar({
    suffix,
    categories,
    sizes,
    selectedCategories,
    selectedSizes,
    openSections,
    values,
    MIN,
    MAX,
    STEP,
    trackBackground,
    toggleSection,
    toggleCategory,
    toggleSize,
    onMinInput,
    onMaxInput,
    resetFilters,
}: FilterSidebarProps) {
    return (
        <>
            <li className="mb-0">
                <div className="body-head">
                    <h6 className="mb-0 text-dark text-uppercase filter-title">Filter By</h6>
                </div>
            </li>
            {/* <hr className="border-0" /> */}

            {/* Category — always expanded, no collapse toggle. Shows every
                category; whichever one(s) arrived via the URL stay checked. */}
            <div className="filter-header mb-0">
                <li className="mb-0 filter-row filter-row-static">
                    <div className="body-head d-flex justify-content-between align-items-center">
                        <h6 className="mb-0 text-dark filter-label">Category</h6>
                    </div>
                </li>
                <div className="collapse show" id={`category-${suffix}`}>
                    <div className="px-3 py-2">
                        {categories.map((category) => (
                            <div className="form-check mb-2" key={category.id}>
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id={`category${category.id}${suffix}`}
                                    checked={selectedCategories.includes(category.id)}
                                    onChange={(e) => toggleCategory(category.id, e.target.checked)}
                                />
                                <label className="form-check-label" htmlFor={`category${category.id}${suffix}`}>
                                    {category.name}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Size — fixed list, no longer fetched */}
            <div className="filter-header mb-0">
                <li
                    className="mb-0 filter-row"
                    onClick={() => toggleSection("size")}
                    aria-expanded={openSections["size"]}
                >
                    <div className="body-head d-flex justify-content-between align-items-center">
                        <h6 className="mb-0 text-dark filter-label">Size</h6>
                        <i className={`fas fa-chevron-down filter-caret ${openSections["size"] ? "rotated" : ""}`}></i>
                    </div>
                </li>
                <div className={`collapse ${openSections["size"] ? "show" : ""}`} id={`size-${suffix}`}>
                    <div className="sizes py-2">
                        {sizes.map((item) => (
                            <li className="mb-2" key={item}>
                                <button
                                    type="button"
                                    className={`size-btn mx-auto ${item.includes("/") ? "size-btn-wide" : ""} ${
                                        selectedSizes.includes(item) ? "active" : ""
                                    }`}
                                    onClick={() => toggleSize(item, !selectedSizes.includes(item))}
                                >
                                    <span>{item}</span>
                                    {selectedSizes.includes(item) && (
                                        <span className="tick">
                                            <i className="fas fa-check"></i>
                                        </span>
                                    )}
                                </button>
                            </li>
                        ))}
                    </div>
                </div>
            </div>

            {/* Price — fixed 0 to 1000 */}
            <div className="filter-header mb-0">
                <li
                    className="mb-0 filter-row"
                    onClick={() => toggleSection("price")}
                    aria-expanded={openSections["price"]}
                >
                    <div className="body-head d-flex justify-content-between align-items-center">
                        <h6 className="mb-0 text-dark filter-label">Price</h6>
                        <i className={`fas fa-chevron-down filter-caret ${openSections["price"] ? "rotated" : ""}`}></i>
                    </div>
                </li>
                <div className={`collapse ${openSections["price"] ? "show" : ""}`} id={`price-${suffix}`}>
                    <div className="px-3 py-2">
                        <div className="dual-range" style={{ background: trackBackground }}>
                            <input
                                type="range"
                                className="range-thumb"
                                min={MIN}
                                max={MAX}
                                step={STEP}
                                value={values[0]}
                                onChange={(e) => onMinInput(e.target.value)}
                            />
                            <input
                                type="range"
                                className="range-thumb"
                                min={MIN}
                                max={MAX}
                                step={STEP}
                                value={values[1]}
                                onChange={(e) => onMaxInput(e.target.value)}
                            />
                        </div>
                        <div className="d-flex align-items-center column-gap-3">
                            <input type="number" className="form-control" value={values[0]} readOnly />
                            <input type="number" className="form-control" value={values[1]} readOnly />
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-3 pt-3 pb-2">
                <button className="btn btn-outline-secondary w-100" onClick={resetFilters}>
                    Reset
                </button>
            </div>
        </>
    );
}
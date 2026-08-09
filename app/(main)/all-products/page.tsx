// app/(main)/all-products/page.tsx
"use client";
import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Products from "@/app/components/product/product";
import FilterSidebar from "@/app/(main)/all-products/filter-sidebar/filter-sidebar";
import { getCategoryList, getColors, getProducts } from "@/app/lib/api";
import "./all-products.css";

interface Category {
    id: number;
    name: string;
    type: string;
}
interface Color {
    id: number;
    name: string;
    code: string;
}

const MIN = 0;
const MAX = 10000;
const STEP = 10;
const sortOptions = [
    { value: "0", label: "Default" },
    { value: "1", label: "Price : Low to High" },
    { value: "2", label: "Price : High to Low" },
];
const sizes = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"];

function AllProductsInner() {
    const searchParams = useSearchParams();
    const categoryIdParam = searchParams.get("categoryId");
    const categoryId = categoryIdParam ? Number(categoryIdParam) : null;
    const categoryNameParam = searchParams.get("categoryName");
    const categoryName = categoryNameParam ? decodeURIComponent(categoryNameParam) : "";

    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [colors, setColors] = useState<Color[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<number[]>(categoryId ? [categoryId] : []);
    const [selectedColors, setSelectedColors] = useState<number[]>([]);
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [sortBy, setSortBy] = useState("0");
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        category: false,
        price: false,
        color: false,
        size: false,
    });
    const [values, setValues] = useState<[number, number]>([0, 5000]);

    const loadProducts = useCallback(
        async (
            overrides: {
                categories?: number[];
                colors?: number[];
                sizes?: string[];
                priceValues?: [number, number];
                sort?: string;
            } = {}
        ) => {
            const cats = overrides.categories ?? selectedCategories;
            const cols = overrides.colors ?? selectedColors;
            const szs = overrides.sizes ?? selectedSizes;
            const [minV, maxV] = overrides.priceValues ?? values;
            const sort = overrides.sort ?? sortBy;
            const queryParams: any = {
                min_price: minV,
                max_price: maxV,
            };
            // No category_id sent at all when nothing is selected -> backend returns everything
            if (cats.length) queryParams.category_id = cats.join(",");
            if (cols.length) queryParams.color_id = cols.join(",");
            if (szs.length) queryParams.size = szs.join(",");
            switch (sort) {
                case "1":
                    queryParams.sort = "price_asc";
                    break;
                case "2":
                    queryParams.sort = "price_desc";
                    break;
                default:
                    queryParams.sort = "";
            }
            setIsLoading(true);
            try {
                const res = await getProducts<any>(queryParams);
                const mapped = res.data.data.map((item: any) => {
                    const itemColors = item.color_variants || [];
                    return {
                        id: item.id,
                        title: item.name,
                        subtitle: item.brand,
                        image: itemColors[0]?.gallery_images?.[0]?.image_url || "/assets/images/no-image.png",
                        badge: item.discount > 0 ? `${item.discount}% OFF` : "",
                        rating: 5,
                        review: 0,
                        sp: item.effective_price,
                        mrp: item.unit_price,
                        category: item.category,
                        category_id: item.category_id,
                        color_variants: itemColors,
                        colors: itemColors.map((variant: any) => ({
                            id: variant.color.id,
                            name: variant.color.name,
                            code: variant.color.code,
                        })),
                    };
                });
                setProducts(mapped);
            } catch {
                // silent
            } finally {
                setIsLoading(false);
            }
        },
        [selectedCategories, selectedColors, selectedSizes, values, sortBy]
    );

    useEffect(() => {
        async function loadCategories() {
            try {
                const res = await getCategoryList<any>();
                setCategories(res.data);
            } catch {
                // silent
            }
        }
        async function loadColors() {
            try {
                const res = await getColors<any>();
                setColors(res.data);
            } catch {
                // silent
            }
        }
        loadCategories();
        loadColors();
        const initialCats = categoryId ? [categoryId] : [];
        setSelectedCategories(initialCats);
        loadProducts({ categories: initialCats });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categoryId]);

    function toggleSection(section: string) {
        setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
    }
    function toggleCategory(id: number, checked: boolean) {
        const next = checked ? [...selectedCategories, id] : selectedCategories.filter((x) => x !== id);
        setSelectedCategories(next);
        loadProducts({ categories: next });
    }
    function toggleColor(id: number, checked: boolean) {
        const next = checked ? [...selectedColors, id] : selectedColors.filter((x) => x !== id);
        setSelectedColors(next);
        loadProducts({ colors: next });
    }
    function toggleSize(size: string, checked: boolean) {
        const next = checked ? [...selectedSizes, size] : selectedSizes.filter((x) => x !== size);
        setSelectedSizes(next);
        loadProducts({ sizes: next });
    }
    function onMinInput(value: string) {
        const next: [number, number] = [Math.min(+value, values[1]), values[1]];
        setValues(next);
        loadProducts({ priceValues: next });
    }
    function onMaxInput(value: string) {
        const next: [number, number] = [values[0], Math.max(+value, values[0])];
        setValues(next);
        loadProducts({ priceValues: next });
    }
    function resetFilters() {
        const cats = categoryId ? [categoryId] : [];
        setSelectedCategories(cats);
        setSelectedColors([]);
        setSelectedSizes([]);
        setValues([0, 5000]);
        setSortBy("0");
        loadProducts({ categories: cats, colors: [], sizes: [], priceValues: [0, 5000], sort: "0" });
    }
    function handleSortChange(value: string) {
        setSortBy(value);
        loadProducts({ sort: value });
    }

    const trackBackground = (() => {
        const minPct = ((values[0] - MIN) / (MAX - MIN)) * 100;
        const maxPct = ((values[1] - MIN) / (MAX - MIN)) * 100;
        return `linear-gradient(to right,var(--border) ${minPct}%,
    var(--sub) ${minPct}%,
    var(--sub) ${maxPct}%,
    var(--border) ${maxPct}%)`;
    })();

    const sidebarProps = {
        categories,
        colors,
        sizes,
        selectedCategories,
        selectedColors,
        selectedSizes,
        openSections,
        values,
        MIN,
        MAX,
        STEP,
        trackBackground,
        toggleSection,
        toggleCategory,
        toggleColor,
        toggleSize,
        onMinInput,
        onMaxInput,
        resetFilters,
    };

    return (
        <div className="filter-products-main">
            <div className="body-head d-flex justify-content-between align-items-center flex-wrap mb-2">
                <h6 className="d-flex align-items-center column-gap-2 mb-0">
                    <Link href="/">Home
                        <i className="fas fa-chevron-right ps-1"></i>
                    </Link>
                    {categoryName ? (
                        <>
                            <Link href="/all-products">All Products
                                <i className="fas fa-chevron-right ps-1"></i>
                            </Link>
                            <a className="active">{categoryName}</a>
                        </>
                    ) : (
                        <a className="active">All Products</a>
                    )}
                </h6>
                <h4>{categoryName || "All Products"}</h4>
                <div className="form select-div mb-3">
                    <label htmlFor="sort" className="me-2">Sort By : </label>
                    <select
                        className="form-select"
                        value={sortBy}
                        onChange={(e) => handleSortChange(e.target.value)}
                    >
                        {sortOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
                <button className="btn filter-responsive" data-bs-toggle="offcanvas" data-bs-target="#filter-offcanvas">
                    <i className="fas fa-sliders-h"></i> Filter
                </button>
            </div>
            <div className="filter-product-flex">
                <div className="filter-product-left">
                    <div className="filter-aside">
                        <div className="flex-sidebar">
                            <div className="flex-shrink-0 filter-sidebar">
                                <ul className="main-ul list-unstyled ps-0 pt-2">
                                    <FilterSidebar suffix="desktop" {...sidebarProps} />
                                </ul>
                            </div>
                        </div>
                        <div
                            className="offcanvas offcanvas-bottom h-75 offcanvas-filter"
                            tabIndex={-1}
                            id="filter-offcanvas"
                            aria-labelledby="offcanvasExampleLabel"
                        >
                            <div className="offcanvas-header">
                                <img src="/assets/images/Logo-Dark.png" height={40} alt="" />
                                <button type="button" className="btn-close bg-white" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                            </div>
                            <div className="offcanvas-body p-0">
                                <div className="flex-shrink-0 filter-sidebar">
                                    <ul className="list-unstyled mt-2 ps-0">
                                        <FilterSidebar suffix="mobile" {...sidebarProps} />
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="filter-product-right">
                    {isLoading && (
                        <div className="loader-wrapper">
                            <div className="spinner-border text-dark" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    )}
                    {!isLoading && products.length > 0 && (
                        <div className="filter-product-grid">
                            {products.map((item) => (
                                <Products key={item.id} product={item} />
                            ))}
                        </div>
                    )}
                    {!isLoading && products.length === 0 && (
                        <div className="text-center py-5">
                            <h5>No Products Found</h5>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AllProducts() {
    return (
        <Suspense
            fallback={
                <div className="text-center py-5">
                    <div className="spinner-border text-main"></div>
                </div>
            }
        >
            <AllProductsInner />
        </Suspense>
    );
}
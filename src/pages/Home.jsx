import React, { useEffect, useState, useMemo } from "react"
// UI Components (Assuming you have a component library like Shadcn/ui)
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    NavigationMenu,
    NavigationMenuList,
    NavigationMenuItem,
    NavigationMenuLink,
} from "@/components/ui/navigation-menu"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Filter,
    EyeOff,
    Eye,
    Sun,
    Moon,
    Monitor,
    X, 
    Tag,
    User,
    BookOpen,
    Users,
    Puzzle,
} from "lucide-react"

// Define API URL
const API_URL = "https://manga-backend-9q0c.onrender.com/" 

// Helper function to get initial theme from local storage or system preference
const getInitialTheme = () => {
    if (typeof window !== 'undefined' && localStorage.getItem("theme")) {
        return localStorage.getItem("theme")
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

// Map for displaying icons next to suggestion type
const IconMap = {
    tag: <Tag className="w-4 h-4 mr-2 text-primary/80" />,
    artist: <User className="w-4 h-4 mr-2 text-primary/80" />,
    parody: <BookOpen className="w-4 h-4 mr-2 text-primary/80" />,
    mgroup: <Users className="w-4 h-4 mr-2 text-primary/80" />,
    character: <Puzzle className="w-4 h-4 mr-2 text-primary/80" />,
    title: <Search className="w-4 h-4 mr-2 text-primary/80" />,
    id: <Search className="w-4 h-4 mr-2 text-primary/80" />,
    title_keyword: <Search className="w-4 h-4 mr-2 text-primary/80" />, 
}

function Home() {
    // --- MAIN STATE ---
    const [manga, setManga] = useState([])
    const [sort, setSort] = useState("added_to_db")
    const [order, setOrder] = useState("desc")
    const [loading, setLoading] = useState(true)
    const [blur, setBlur] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 30
    const [theme, setTheme] = useState(getInitialTheme)
    
    // --- FILTER STATE ---
    const [selectedLanguages, setSelectedLanguages] = useState([])
    const [languageFilter, setLanguageFilter] = useState("")
    const [isLangPopoverOpen, setIsLangPopoverOpen] = useState(false)
    
    // --- SEARCH/AUTOCOMPLETE STATE ---
    const [rawQuery, setRawQuery] = useState("") 
    const [queryPills, setQueryPills] = useState([]) 
    const [suggestions, setSuggestions] = useState([]) 
    const [isSuggestOpen, setIsSuggestOpen] = useState(false) 

    const validFilterKeys = useMemo(() => ['artist', 'tag', 'parody', 'mgroup', 'character', 'id'], [])
    const allValidKeys = useMemo(() => [...validFilterKeys, 'title'], [validFilterKeys])


    // --- Theme/Fetch Effects (Unchanged) ---
    useEffect(() => {
        const root = window.document.documentElement
        root.classList.remove("light", "dark")

        if (theme === "system") {
            const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches
            root.classList.add(isDark ? "dark" : "light")
        } else {
            root.classList.add(theme)
        }
        localStorage.setItem("theme", theme)
    }, [theme])

    useEffect(() => {
        async function fetchManga() {
            try {
                setLoading(true)
                
                if (queryPills.length > 0) {
                    const q = queryPills
                        .map(pill => `${pill.key}:"${pill.value}"`)
                        .join(" ")

                    const search_call = `${API_URL}search?q=${encodeURIComponent(q)}`
                    const res = await fetch(search_call)
                    if (!res.ok) throw new Error("Search Failed")
                    const data = await res.json()
                    setManga(data)
                } 
                else {
                    const params = new URLSearchParams()
                    if (sort) params.append("sortBy", sort)
                    if (order) params.append("order", order)
                    if (languageFilter) params.append("language", languageFilter)

                    const manga_call = `${API_URL}?${params.toString()}`
                    const res = await fetch(manga_call)
                    if (!res.ok) throw new Error("Fetch Failed")
                    const data = await res.json()
                    setManga(data)
                }
                setCurrentPage(1) 
            } catch (error) {
                console.error(error)
                setManga([])
            } finally {
                setLoading(false)
            }
        }

        fetchManga()
    }, [sort, order, languageFilter, queryPills.length]) 

    // --- Pagination & Language Filter Logic (Unchanged) ---
    const totalPages = Math.ceil(manga.length / itemsPerPage)
    const indexOfLast = currentPage * itemsPerPage
    const indexOfFirst = indexOfLast - itemsPerPage
    const currentManga = manga.slice(indexOfFirst, indexOfLast)

    const goToPage = (pageNum) => setCurrentPage(pageNum)
    const goToNext = () => currentPage < totalPages && setCurrentPage((prev) => prev + 1)
    const goToPrev = () => currentPage > 1 && setCurrentPage((prev) => prev - 1)

    function toggleLanguage(lang) {
        setSelectedLanguages((prev) =>
            prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
        )
    }

    function submitLanguages() {
        setLanguageFilter(selectedLanguages.join(","))
        setIsLangPopoverOpen(false)
    }
    
    // --- MODIFIED SEARCH/AUTOCOMPLETE FUNCTIONS ---

    // Function to fetch suggestions (Uses /suggest-unified)
    async function fetchSuggestions(term) {
        if (term.length < 2) {
            setSuggestions([])
            setIsSuggestOpen(false)
            return
        }

        try {
            const res = await fetch(`${API_URL}suggest-unified?term=${encodeURIComponent(term)}`)
            const data = await res.json()
            setSuggestions(data)
            setIsSuggestOpen(data.length > 0)
        } catch (err) {
            console.error("Suggestion fetch failed:", err)
            setSuggestions([])
            setIsSuggestOpen(false)
        }
    }

    // Handles text input change and triggers suggestions based on the last term.
    function handleQueryChange(newQuery) {
        setRawQuery(newQuery)
        const trimmedQuery = newQuery.trim()

        if (!trimmedQuery) {
            setSuggestions([]);
            setIsSuggestOpen(false);
            return;
        }

        // Find the last independent, non-quoted term
        const lastTermMatch = trimmedQuery.match(/(\S+)$/)

        let termToSuggest = lastTermMatch ? lastTermMatch[1] : trimmedQuery;

        // If the last term is a partial structured filter (e.g., "tag:l"), only use "l" for search
        if (termToSuggest.includes(':')) {
            termToSuggest = termToSuggest.split(':').pop();
        }

        if (termToSuggest && termToSuggest.length >= 2) {
            fetchSuggestions(termToSuggest);
        } else {
            setSuggestions([]);
            setIsSuggestOpen(false);
        }
    }

    // Function to commit the current raw query as a new pill
    function commitQuery() {
        if (!rawQuery.trim()) return

        let key = 'title';
        let value = rawQuery.trim();

        // Check if the query is a structured key:value pair
        const match = rawQuery.match(/^(\w+):(.+)/);

        if (match) {
            key = match[1].toLowerCase();
            value = match[2].trim();
        }

        if (allValidKeys.includes(key) && value.length > 0) {
            // Clean up quotes from the value
            if ((value.startsWith('"') && value.endsWith('"'))) {
                value = value.slice(1, -1);
            }
            
            const api_key = key.replace('_keyword', '');
            
            // Add the new pill and clear the input
            setQueryPills(prev => [...prev, { key: api_key, value }]); 
            setRawQuery("");
            setSuggestions([]);
            setIsSuggestOpen(false);

            if (languageFilter) {
                setLanguageFilter("")
                setSelectedLanguages([])
            }
        } else {
            // Commit as a simple keyword search if no structure is found
            setQueryPills(prev => [...prev, { key: 'title', value: rawQuery }]);
            setRawQuery("");
            setSuggestions([]);
            setIsSuggestOpen(false);
        }
    }

    // Function to remove a pill
    function removePill(index) {
        setQueryPills(prev => prev.filter((_, i) => i !== index))
    }
    
    // Function to apply a suggestion from the dropdown
    function selectSuggestion(suggestion) {
        // 1. Construct the new structured filter
        const newFilter = `${suggestion.type}:"${suggestion.value}"`;

        const trimmedQuery = rawQuery.trim();
        
        // 2. Find the last term that triggered the suggestion
        const lastTermMatch = trimmedQuery.match(/(\S+)$/);
        
        let finalQuery;

        if (lastTermMatch) {
            // Replace only the last partial term with the new, structured filter.
            finalQuery = trimmedQuery.replace(/(\S+)$/, newFilter);
            setRawQuery(finalQuery + " "); // Add space for next term
        } else {
            // If typing from a clean slate
            finalQuery = newFilter;
            setRawQuery(finalQuery + " "); 
        }

        // 3. Clear suggestions and close popover (Focus maintained by preventing popover from stealing it).
        setSuggestions([]);
        setIsSuggestOpen(false);
    }

    // --------------------- UI RENDERING ---------------------
    const languages = [
        "English", "Japanese", "Korean", "Chinese", "French",
        "German", "Spanish", "Portuguese", "Italian", "Russian",
        "Vietnamese", "Indonesian", "Thai", "Ukrainian", "Null"
    ].sort()

    if (loading)
        return (
            <div className="flex flex-col justify-center items-center h-screen text-xl font-semibold text-muted-foreground gap-4 bg-slate-50 dark:bg-gray-900">
                <span className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
                <span>Loading **hManga** content...</span>
            </div>
        )

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-2 flex items-center justify-between">
                    <NavigationMenu className="h-auto">
                        <NavigationMenuList>
                            <NavigationMenuItem>
                                <NavigationMenuLink
                                    className="text-2xl font-extrabold tracking-tighter text-primary dark:text-white cursor-pointer hover:opacity-80 transition-opacity py-1"
                                    onClick={() => {
                                        setSort("added_to_db")
                                        setOrder("desc")
                                        setSelectedLanguages([])
                                        setLanguageFilter("")
                                        setQueryPills([]) 
                                        setRawQuery("")
                                        setCurrentPage(1)
                                    }}
                                >
                                    hManga
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                        </NavigationMenuList>
                    </NavigationMenu>

                    <div className="flex items-center space-x-2">
                         {/* Theme Switch & Blur Toggle */}
                         <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    {theme === "light" && <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />}
                                    {theme === "dark" && <Moon className="h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />}
                                    {theme === "system" && <Monitor className="h-[1.2rem] w-[1.2rem] transition-all" />}
                                    <span className="sr-only">Toggle theme</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-40 p-1">
                                <Button variant="ghost" className="w-full justify-start" onClick={() => setTheme("light")}>
                                    <Sun className="mr-2 h-4 w-4" /> Light
                                </Button>
                                <Button variant="ghost" className="w-full justify-start" onClick={() => setTheme("dark")}>
                                    <Moon className="mr-2 h-4 w-4" /> Dark
                                </Button>
                                <Button variant="ghost" className="w-full justify-start" onClick={() => setTheme("system")}>
                                    <Monitor className="mr-2 h-4 w-4" /> System
                                </Button>
                            </PopoverContent>
                        </Popover>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setBlur((prev) => !prev)}
                            title={blur ? "Show Covers" : "Hide Covers"}
                        >
                            {blur ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </Button>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">
                <h1 className="text-4xl font-bold mb-6 tracking-tight">Manga Directory</h1>

                {/* Filter Bar */}
                <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700">

                    {/* Search Input Group with Autocomplete */}
                    <div className="flex flex-col gap-2 w-full lg:max-w-md">
                        {/* Applied Query Pills */}
                        {queryPills.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                                {queryPills.map((pill, index) => (
                                    <Badge 
                                        key={index} 
                                        variant="secondary" 
                                        className="pl-3 pr-2 py-1 text-sm font-medium"
                                    >
                                        <span className="capitalize">{pill.key}:</span> {pill.value}
                                        <button onClick={() => removePill(index)} className="ml-1 opacity-70 hover:opacity-100 transition-opacity">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}

                        <Popover open={isSuggestOpen} onOpenChange={setIsSuggestOpen}>
                            <PopoverTrigger asChild>
                                <div className="relative w-full">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        value={rawQuery}
                                        onChange={(e) => handleQueryChange(e.target.value)}
                                        placeholder="Type a tag, artist, or title..."
                                        className="w-full pl-10 shadow-sm"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && rawQuery.trim()) {
                                                commitQuery();
                                            }
                                            // Allows ESC to close suggestions without clearing input
                                            if (e.key === "Escape") {
                                                setIsSuggestOpen(false);
                                            }
                                        }}
                                    />
                                </div>
                            </PopoverTrigger>
                            
                            {/* Autocomplete Suggestions Content */}
                            {suggestions.length > 0 && (
                                <PopoverContent 
                                    className="w-[300px] p-1 z-50"
                                    // CRITICAL FIX: Prevent the popover from stealing focus when it opens.
                                    onOpenAutoFocus={(e) => e.preventDefault()}
                                >
                                    <div className="max-h-64 overflow-y-auto">
                                        <p className="px-3 py-1 text-xs text-muted-foreground border-b mb-1">
                                            Suggestions for "{rawQuery.trim().match(/(\S+)$/)?.[1] || rawQuery.trim()}":
                                        </p>
                                        {suggestions.map((suggestion, index) => (
                                            <Button
                                                key={index}
                                                variant="ghost"
                                                className="w-full justify-start text-sm h-9"
                                                onClick={(e) => {
                                                    e.preventDefault(); 
                                                    selectSuggestion(suggestion);
                                                    // Optionally ensure focus is back on the input
                                                    e.currentTarget.closest('.relative').querySelector('input').focus();
                                                }} 
                                            >
                                                {IconMap[suggestion.type]}
                                                <span className="truncate">{suggestion.value}</span>
                                                <span className="ml-auto text-xs text-muted-foreground capitalize">
                                                    ({suggestion.type})
                                                </span>
                                            </Button>
                                        ))}
                                    </div>
                                </PopoverContent>
                            )}
                        </Popover>

                        {/* Search Button (Acts as "Add Filter" when rawQuery is present) */}
                        <Button 
                            onClick={() => commitQuery()} 
                            className="shrink-0" 
                            disabled={!rawQuery.trim() && queryPills.length === 0}
                        >
                            <Search className="w-4 h-4 mr-2 hidden sm:inline" />
                            {rawQuery.trim() 
                                ? "Add Filter" 
                                : queryPills.length > 0 ? "Execute Search" : "Search All"}
                        </Button>
                    </div>

                    {/* Filter/Sort Controls (Unchanged) */}
                    <div className="flex gap-3 flex-wrap justify-end">
                        <Select
                            onValueChange={(value) => {
                                const [newSort, newOrder] = value.split("-")
                                setSort(newSort)
                                setOrder(newOrder)
                            }}
                            value={sort && order ? `${sort}-${order}` : undefined}
                        >
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="added_to_db-desc">Newest Added (Default)</SelectItem>
                                <SelectItem value="added_to_db-asc">Oldest Added</SelectItem>
                                <SelectItem value="date-desc">Newest Published</SelectItem>
                                <SelectItem value="date-asc">Oldest Published</SelectItem>
                                <SelectItem value="Artist-asc">Artist (A-Z)</SelectItem>
                                <SelectItem value="Artist-desc">Artist (Z-A)</SelectItem> 
                                <SelectItem value="bookmark_add_date-desc">Bookmark ⬇</SelectItem>
                            </SelectContent>
                        </Select>

                        <Popover open={isLangPopoverOpen} onOpenChange={setIsLangPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full sm:w-[180px] justify-between" disabled={queryPills.length > 0}>
                                    <Filter className="w-4 h-4 mr-2" />
                                    <span>Languages ({selectedLanguages.length})</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-0">
                                <div className="max-h-64 overflow-y-auto p-4">
                                    <h4 className="font-medium text-sm mb-2 border-b pb-2">Filter Languages</h4>
                                    <div className="space-y-2">
                                        {languages.map((lang) => (
                                            <div key={lang} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`lang-${lang}`}
                                                    checked={selectedLanguages.includes(lang)}
                                                    onCheckedChange={() => toggleLanguage(lang)}
                                                />
                                                <label
                                                    htmlFor={`lang-${lang}`}
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                >
                                                    {lang}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-3 border-t flex justify-between gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSelectedLanguages([]);
                                            setLanguageFilter("");
                                            setIsLangPopoverOpen(false);
                                        }}
                                        className="flex-1"
                                    >
                                        Clear
                                    </Button>
                                    <Button onClick={submitLanguages} className="flex-1">
                                        Apply Filter
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {/* Manga Grid (Unchanged) */}
                <div
                    key={currentPage}
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8"
                >
                    {currentManga.length > 0 ? (
                        currentManga.map((manga, index) => (
                            <div
                                key={index}
                                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-100 dark:border-gray-700"
                            >
                                <a
                                    href={manga.gallery_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block h-auto aspect-[3/4] relative overflow-hidden"
                                >
                                    <img
                                        src={`${API_URL}proxy-image?url=${encodeURIComponent(manga.cover_image_url)}`}
                                        alt={manga.title}
                                        className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${blur ? "filter blur-md group-hover:blur-sm" : ""}`}
                                    />
                                    {blur && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm group-hover:backdrop-blur-none transition-all duration-500">
                                            <Eye className="w-8 h-8 text-white opacity-70 group-hover:opacity-0 transition-opacity" />
                                        </div>
                                    )}
                                </a>
                                <div className="p-3 space-y-1">
                                    <h2 className="text-sm font-semibold line-clamp-2 min-h-[2.5rem] hover:text-primary transition-colors">
                                        <a href={manga.gallery_url} target="_blank" rel="noreferrer" title={manga.title}>
                                            {manga.title}
                                        </a>
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        **Artist:** {manga.artist.length > 0 ? manga.artist.join(", ") : "Unknown"}
                                    </p>
                                    <div className="flex flex-wrap gap-1 pt-1">
                                        <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                            {manga.language || "N/A"}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs px-2 py-0.5">
                                            {manga.date ? new Date(manga.date).toLocaleDateString() : "N/A"}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-20 text-muted-foreground">
                            <Search className="w-10 h-10 mx-auto mb-4" />
                            <p className="text-xl font-semibold">No manga found matching your criteria.</p>
                            <p>Try adjusting your search or filters.</p>
                        </div>
                    )}
                </div>

                {/* Pagination (Unchanged) */}
                {totalPages > 1 && (
                    <div className="mt-12 flex flex-wrap justify-center items-center gap-2">
                        <Button
                            onClick={goToPrev}
                            disabled={currentPage === 1}
                            variant="outline"
                        >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Previous
                        </Button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(pageNum =>
                                pageNum === 1 ||
                                pageNum === totalPages ||
                                (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
                            )
                            .map((pageNum, index, arr) => {
                                const isGap = index > 0 && pageNum > arr[index - 1] + 1;

                                return (
                                    <React.Fragment key={pageNum}>
                                        {isGap && <span className="text-muted-foreground mx-1">...</span>}
                                        <Button
                                            className="w-8 h-8 p-0"
                                            onClick={() => goToPage(pageNum)}
                                            variant={pageNum === currentPage ? "default" : "outline"}
                                        >
                                            {pageNum}
                                        </Button>
                                    </React.Fragment>
                                )
                            })}

                        <Button
                            onClick={goToNext}
                            disabled={currentPage === totalPages}
                            variant="outline"
                        >
                            Next
                            <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                        <span className="ml-4 text-sm text-muted-foreground hidden sm:inline">
                            Page {currentPage} of {totalPages}
                        </span>
                    </div>
                )}
            </div>

            <footer className="border-t mt-12 py-6 bg-white dark:bg-gray-800 dark:border-gray-700">
                <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                    &copy; {new Date().getFullYear()} hManga. All rights reserved. | Data from **{API_URL.replace('https://', '').split('/')[0]}**
                </div>
            </footer>
        </div>
    )
}

export default Home

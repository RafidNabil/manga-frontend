import React, { useEffect, useState } from "react"
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
    Sun,     // Added Sun icon for light mode
    Moon,    // Added Moon icon for dark mode
    Monitor  // Added Monitor icon for system mode
} from "lucide-react" 

const API_URL = "https://manga-backend-9q0c.onrender.com/"
// const API_URL = "http://localhost:5000/"

// Helper function to get initial theme from local storage or system preference
const getInitialTheme = () => {
    if (typeof window !== 'undefined' && localStorage.getItem("theme")) {
        return localStorage.getItem("theme")
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function Home() {
  const [manga, setManga] = useState([])
  const [sort, setSort] = useState("added_to_db")
  const [order, setOrder] = useState("desc")
  const [artist, setArtist] = useState("")
  const [selectedLanguages, setSelectedLanguages] = useState([])
  const [languageFilter, setLanguageFilter] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [blur, setBlur] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 30
  const [isLangPopoverOpen, setIsLangPopoverOpen] = useState(false)
  const [theme, setTheme] = useState(getInitialTheme) // New state for theme

  // --- Theme Management Effect ---
  useEffect(() => {
    const root = window.document.documentElement
    
    // Cleanup classes
    root.classList.remove("light", "dark")

    if (theme === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      root.classList.add(isDark ? "dark" : "light")
    } else {
      root.classList.add(theme)
    }

    // Save preference
    localStorage.setItem("theme", theme)
  }, [theme])

  useEffect(() => {
    async function fetchManga() {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        if (sort) params.append("sortBy", sort)
        if (order) params.append("order", order)
        if (artist) params.append("artist", artist)
        if (languageFilter) params.append("language", languageFilter)

        const manga_call = `${API_URL}?${params.toString()}`
        const res = await fetch(manga_call)
        if (!res.ok) throw new Error("Failed to Fetch")
        const data = await res.json()
        setManga(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchManga()
  }, [sort, order, artist, languageFilter])

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
    setCurrentPage(1)
    setIsLangPopoverOpen(false) // Close popover on submit
  }

  async function searchManga(term) {
    if (!term.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}search?q=${encodeURIComponent(term)}`)
      const data = await res.json()
      setManga(data)
      setCurrentPage(1)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

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
    // Ensure the main container respects the theme state for background
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <NavigationMenu className="h-auto"> {/* Added h-auto for better sizing */}
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink
                  className="text-2xl font-extrabold tracking-tighter text-primary dark:text-white cursor-pointer hover:opacity-80 transition-opacity py-1"
                  onClick={() => {
                    // Reset logic...
                    setSort("added_to_db")
                    setOrder("desc")
                    setArtist("")
                    setSelectedLanguages([])
                    setLanguageFilter("")
                    setSearchTerm("")
                    setCurrentPage(1)
                    window.location.href = "/"
                  }}
                >
                  hManga
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex items-center space-x-2">
            {/* Dark/Light Theme Switch */}
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

            {/* Blur Toggle Button */}
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
        
        {/* Filter Bar remains the same */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700">
          
          {/* Search Input Group */}
          <div className="flex gap-2 w-full lg:max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, tag, or artist..."
                className="w-full pl-10 shadow-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    searchManga(searchTerm)
                  }
                }}
              />
            </div>
            <Button onClick={() => searchManga(searchTerm)} className="shrink-0">
              <Search className="w-4 h-4 mr-2 hidden sm:inline" />Search
            </Button>
          </div>

          {/* Filter/Sort Controls */}
          <div className="flex gap-3 flex-wrap justify-end">
            
            {/* Sort Dropdown */}
            <Select
              onValueChange={(value) => {
                const [newSort, newOrder] = value.split("-")
                setSort(newSort)
                setOrder(newOrder)
                setCurrentPage(1) // Reset page on sort change
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
                <SelectItem value="bookmark_add_date-desc">Bookmark ⬇</SelectItem>
              </SelectContent>
            </Select>

            {/* Language Filter Popover */}
            <Popover open={isLangPopoverOpen} onOpenChange={setIsLangPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-[180px] justify-between">
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
                      setCurrentPage(1);
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

        {/* --- */}

        {/* Manga Grid (No changes) */}
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

        {/* --- */}

        {/* Pagination (No changes) */}
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

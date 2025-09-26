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

// const API_URL = "https://manga-backend-production-5e57.up.railway.app"
const API_URL = "https://manga-backend-9q0c.onrender.com/"

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

  useEffect(() => {
    async function fetchManga() {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        if (sort) params.append("sortBy", sort)
        if (order) params.append("order", order)
        if (artist) params.append("artist", artist)
        if (languageFilter) params.append("language", languageFilter)

        const manga_call = `${API_URL}/?${params.toString()}`
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
    const dropdown = document.getElementById("lang-dropdown")
    if (dropdown) dropdown.classList.add("hidden")
  }

  async function searchManga(term) {
    if (!term.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(term)}`)
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
    "Chinese", "German", "Indonesian", "Thai", "English", "Italian", "Null",
    "French", "Ukrainian", "Russian", "Vietnamese", "Japanese", "Portuguese",
    "Spanish", "Korean"
  ]

  if (loading)
    return (
      <div className="flex flex-col justify-center items-center h-screen text-xl font-semibold text-muted-foreground gap-4">
        <span className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></span>
        <span>Loading manga...</span>
      </div>
    )

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink
                  className="text-2xl font-bold tracking-tight text-primary cursor-pointer"
                  onClick={() => {
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
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Filter Bar */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search manga..."
              className="w-full sm:w-64 shadow-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  searchManga(searchTerm)
                }
              }}
            />
            <Button onClick={() => searchManga(searchTerm)}>Search</Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <Select
              onValueChange={(value) => {
                const [newSort, newOrder] = value.split("-")
                setSort(newSort)
                setOrder(newOrder)
              }}
              value={sort && order ? `${sort}-${order}` : undefined}
            >
              <SelectTrigger className="sm:w-44 w-full">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Artist-asc">Artist</SelectItem>
                <SelectItem value="date-asc">Date ⬆</SelectItem>
                <SelectItem value="date-desc">Date ⬇</SelectItem>
                <SelectItem value="added_to_db-asc">Added to DB ⬆</SelectItem>
                <SelectItem value="added_to_db-desc">Added to DB ⬇</SelectItem>
                <SelectItem value="bookmark_add_date-asc">Bookmark ⬆</SelectItem>
                <SelectItem value="bookmark_add_date-desc">Bookmark ⬇</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative w-full sm:w-44">
              <button
                className="w-full text-left border rounded px-3 py-2"
                onClick={() => {
                  const el = document.getElementById("lang-dropdown")
                  if (el) el.classList.toggle("hidden")
                }}
              >
                Select Languages
              </button>

              <div
                id="lang-dropdown"
                className="absolute z-10 mt-1 w-full bg-white border rounded shadow-md hidden max-h-48 overflow-auto"
              >
                {languages.map((lang) => (
                  <label
                    key={lang}
                    className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedLanguages.includes(lang)}
                      onChange={() => toggleLanguage(lang)}
                      className="mr-2"
                    />
                    {lang}
                  </label>
                ))}
              </div>
            </div>

            <Button onClick={submitLanguages}>Submit</Button>
            <Button onClick={() => setBlur((prev) => !prev)}>Blur</Button>
          </div>
        </div>

        {/* Manga Grid */}
        <div
          key={currentPage}
          className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6"
        >
          {currentManga.map((manga, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden"
            >
              <a
                href={manga.gallery_url}
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                <img
                  src={`${API_URL}/proxy-image?url=${encodeURIComponent(manga.cover_image_url)}`}
                  alt={manga.title}
                  className={`w-full h-52 sm:h-80 object-contain bg-gray-200 object-center transition-transform duration-300 hover:scale-105 ${blur ? "blur" : ""}`}
                />
              </a>
              <div className="p-3">
                <h2 className="text-sm font-semibold line-clamp-2">{manga.title}</h2>
                <p className="text-xs font-semibold mt-1">ID: {manga.id}</p>
                <p className="text-xs font-semibold mt-1">{manga.date.split("T")[0]}</p>
                <p className="text-xs font-semibold mt-1">Lang: {manga.language}</p>
                <p className="text-xs font-semibold mt-1">
                  Artist: {manga.artist.join(", ")}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {manga.tags.map((tag, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="bg-gray-500 text-white dark:bg-blue-600"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-10 flex flex-wrap justify-center items-center gap-2">
          <Button onClick={goToPrev} disabled={currentPage === 1}>
            Prev
          </Button>
          {[...Array(totalPages)].map((_, i) => {
            const pageNum = i + 1
            return (
              <Button
                key={pageNum}
                className="w-10 sm:w-auto px-3"
                onClick={() => goToPage(pageNum)}
                variant={pageNum === currentPage ? "default" : "outline"}
              >
                {pageNum}
              </Button>
            )
          })}
          <Button onClick={goToNext} disabled={currentPage === totalPages}>
            Next
          </Button>
        </div>
      </main>
    </div>
  )
}

export default Home

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

const API_URL = process.env.REACT_APP_API_URL

function Home() {
  const [manga, setManga] = useState([])
  const [sort, setSort] = useState("added_to_db")
  const [order, setOrder] = useState("desc")
  const [artist, setArtist] = useState("")
  const [selectedLanguages, setSelectedLanguages] = useState([])
  const [languageFilter, setLanguageFilter] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [blur, setBlur] = useState(true);
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 30

  useEffect(() => {
    async function fetchManga() {
      try {
        setLoading(true)

        const params = new URLSearchParams()
        if (sort) params.append('sortBy', sort)
        if (order) params.append('order', order)
        if (artist) params.append('artist', artist)
        if (languageFilter) params.append('language', languageFilter) // comma separated

        // const manga_call = `http://localhost:5000/?${params.toString()}`
        const manga_call = `${API_URL}/?${params.toString()}`

        console.log("Fetching from", manga_call);
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
  const goToNext = () => currentPage < totalPages && setCurrentPage(prev => prev + 1)
  const goToPrev = () => currentPage > 1 && setCurrentPage(prev => prev - 1)

  function toggleLanguage(lang) {
    setSelectedLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    )
  }

  function submitLanguages() {
    setLanguageFilter(selectedLanguages.join(","))
    setCurrentPage(1)
    // Hide dropdown after submit
    const dropdown = document.getElementById("lang-dropdown")
    if (dropdown) dropdown.classList.add("hidden")
  }

  async function searchManga(term) {
    if (!term.trim()) return
    setLoading(true)

    try {
      // const res = await fetch(`http://localhost:5000/search?q=${encodeURIComponent(term)}`)
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
    "Chinese",
    "German",
    "Indonesian",
    "Thai",
    "English",
    "Italian",
    "Null",
    "French",
    "Ukrainian",
    "Russian",
    "Vietnamese",
    "Japanese",
    "Portuguese",
    "Spanish",
    "Korean"
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
      {/* Navbar */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink className="text-2xl font-bold tracking-tight text-primary cursor-pointer"
                  onClick={() => {
                    setSort("added_to_db");
                    setOrder("desc");
                    setArtist("");
                    setSelectedLanguages([]);
                    setLanguageFilter("");
                    setSearchTerm("");
                    setCurrentPage(1);
                    window.location.href = '/';  // reload page
                  }}>
                  hManga
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Filter Bar */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex gap-2">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search manga..."
              className="w-full md:max-w-sm shadow-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  searchManga(searchTerm)
                }
              }}
            />


            <Button className="cursor-pointer" onClick={() => searchManga(searchTerm)}>Search</Button>
          </div>



          <div className="flex gap-4 items-center">
            {/* Sort Select */}
            <Select
              onValueChange={(value) => {
                const [newSort, newOrder] = value.split('-')
                setSort(newSort)
                setOrder(newOrder)
              }}
              value={sort && order ? `${sort}-${order}` : undefined}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Artist-asc">Artist</SelectItem>
                <SelectItem value="date-asc">Date  ⬆</SelectItem>
                <SelectItem value="date-desc">Date ⬇</SelectItem>
                <SelectItem value="added_to_db-asc">Added to DB  ⬆</SelectItem>
                <SelectItem value="added_to_db-desc">Added to DB ⬇</SelectItem>
                <SelectItem value="bookmark_add_date-asc">Bookmark ⬆</SelectItem>
                <SelectItem value="bookmark_add_date-desc">Bookmark ⬇</SelectItem>
              </SelectContent>
            </Select>

            {/* Multi-select Languages */}
            <div className="relative w-[180px]">
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

            <Button onClick={submitLanguages} className="cursor-pointer">Submit</Button>
            <Button onClick={() => setBlur(prev => !prev)} className="cursor-pointer">Blur</Button>
          </div>
        </div>

        {/* Manga Grid */}
        <div
          key={currentPage}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 "
        >

          {currentManga.map((manga, index) => (
            <div
              key={index}
              className="bg-blue rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden"
            >
              <a
                href={manga.gallery_url}
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                <img
                  // src={`http://localhost:5000/proxy-image?url=${encodeURIComponent(
                  //   manga.cover_image_url
                  // )}`}
                  src={`${API_URL}/proxy-image?url=${encodeURIComponent(manga.cover_image_url)}`}

                  alt={manga.title}
                  className={`w-full h-80 object-contain bg-grey object-center transition-transform duration-300 hover:scale-105 ${blur ? 'blur' : ''}`}
                />
              </a>
              <div className="p-3">
                <h2 className="text-sm font-semibold line-clamp-2">
                  {manga.title}
                </h2>
                <p className="text-xs font-semibold mt-1">ID: {manga.id}</p>
                <p className="text-xs font-semibold mt-1">
                  {manga.date.split('T')[0]}
                </p>
                <p className="text-xs font-semibold mt-1">Lang: {manga.language}</p>
                <p className="text-xs font-semibold mt-1">
                  Artist: {manga.artist.join(', ')}
                </p>

                {manga.tags.map((tag) => (<Badge
                  variant="outline"
                  className="bg-gray-500 text-white dark:bg-blue-600"
                >{tag}</Badge>))}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-10 flex justify-center items-center flex-wrap gap-2">
          <Button className="cursor-pointer" onClick={goToPrev} disabled={currentPage === 1}>
            Prev
          </Button>
          {[...Array(totalPages)].map((_, i) => {
            const pageNum = i + 1
            return (
              <Button
                key={pageNum}
                className="cursor-pointer"
                onClick={() => goToPage(pageNum)}
                variant={pageNum === currentPage ? "default" : "outline"}
              >
                {pageNum}
              </Button>
            )
          })}
          <Button className="cursor-pointer" onClick={goToNext} disabled={currentPage === totalPages}>
            Next
          </Button>
        </div>
      </main>
    </div>
  )
}

export default Home

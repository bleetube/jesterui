import React, { ChangeEvent, useState } from 'react'

import { useIncomingNostrEvents } from '../context/NostrEventsContext'
import { useNavigate } from 'react-router-dom'

// @ts-ignore
import Heading1 from '@material-tailwind/react/Heading1'
// @ts-ignore
import Heading6 from '@material-tailwind/react/Heading6'
// @ts-ignore
import Input from '@material-tailwind/react/Input'
import * as JesterUtils from '../util/jester'

export default function SearchPage() {
  const navigate = useNavigate()
  const incomingNostr = useIncomingNostrEvents()
  const [searchInputValue, setSearchInputValue] = useState<string>('')
  const [searchResults, setSearchResults] = useState<string[] | null>(null)
  const [inputIsJesterId, setInputIsJesterId] = useState<boolean | null>(null)

  const search = (searchInput: string) => {
    if (!searchInput) {
      setSearchResults([])
      return
    }

    // currently, the search value must be a jester id
    const indexOfPrefix = searchInput.indexOf(JesterUtils.JESTER_ID_PREFIX + '1')
    if (indexOfPrefix < 0) {
      setInputIsJesterId(false)
      setSearchResults([])
      return
    }

    // try finding a jesterId in the input, e.g. might be an url "https://example.com/jester1abcdef123..."
    const possibleJesterId = searchInput.substring(indexOfPrefix)
    console.debug(`Found possible jesterId: ${possibleJesterId}`)

    const jesterId = JesterUtils.tryParseJesterId(possibleJesterId as JesterUtils.JesterId)
    if (jesterId === null) {
      console.warn('Could not parse jesterId from search input value')
      setSearchResults([])
      setInputIsJesterId(false)
      return
    }

    // at the moment, just redirect to the game - may not exist, but thats fine for now
    setInputIsJesterId(true)
    setSearchResults(null)
    navigate(`/redirect/game/${jesterId}`)
  }

  const onSearchButtonClicked = () => {
    search(searchInputValue)
  }

  const onSearchInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchInputValue(e.target.value)
    setInputIsJesterId(null)
    setSearchResults(null)
  }

  return (
    <div className="screen-index">
      <div className="flex justify-center items-center">
        {!incomingNostr ? (
          <div>No connection to nostr</div>
        ) : (
          <>
            <div className="w-full grid grid-cols-1">
              <div className="flex justify-center">{<Heading1 color="blueGray">chess on nostr</Heading1>}</div>
              <form noValidate onSubmit={() => onSearchButtonClicked()}>
                <div className="pb-2 grow">
                  <Input
                    type="text"
                    size="lg"
                    outline={true}
                    value={searchInputValue}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => onSearchInputChange(e)}
                    placeholder="Search"
                    style={{ color: 'currentColor' }}
                    error={inputIsJesterId === false ? ' ' : undefined}
                    success={inputIsJesterId === true ? ' ' : undefined}
                  />
                </div>

                <div className="flex justify-center items-center">
                  <button type="submit" className={`bg-white bg-opacity-20 rounded px-5 py-4 mx-1 my-4`}>
                    Search
                  </button>
                </div>
              </form>
              <div className="pb-2 grow">
                {searchResults?.length === 0 && (
                  <>
                    <Heading6 color="blueGray">No results found. </Heading6>
                    <p>Are you sure this is a game id?</p>
                    <p>
                      <small>
                        e.g. a game id looks like this:{' '}
                        <code>jester13s8c6xzp33n93zn2qmvtgaypncphz585fggggnzvppmxnyamvc4qpu3sdv</code>
                      </small>
                    </p>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
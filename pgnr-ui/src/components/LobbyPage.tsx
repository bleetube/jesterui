import React, { useEffect, useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'

import { useIncomingNostrEvents } from '../context/NostrEventsContext'
import { useSettings } from '../context/SettingsContext'
import { useGameStore } from '../context/GameEventStoreContext'

import { GameStartOrNewIdentityButton } from '../components/GameStartOrNewIdentityButton'
import CreateDevelGameButton from '../components/devel/CreateDevelGameButton'
import CreateMultipleGamesButton from '../components/devel/CreateMultipleGamesButton'
import { GameCard } from '../components/GameCard'
import { Spinner } from '../components/Spinner'
import { GameById } from '../components/jester/GameById'
import { NoConnectionAlert } from '../components/NoConnectionAlert'

import { getSession } from '../util/session'
import { GameStartEvent } from '../util/app_db'
import { jesterIdToGameId, jesterPrivateStartGameRef } from '../util/jester'

// @ts-ignore
import Heading6 from '@material-tailwind/react/Heading6'
// @ts-ignore
import Small from '@material-tailwind/react/Small'

const GAMES_FILTER_PAST_DURATION_IN_MINUTES = process.env.NODE_ENV === 'development' ? 30 : 5
const GAMES_FILTER_PAST_DURATION_IN_SECONDS = GAMES_FILTER_PAST_DURATION_IN_MINUTES * 60
const MAX_AMOUNT_OF_GAMES = 100
const MIN_UPDATE_IN_SECONDS = 10

interface GamesFilter {
  from: Date
  until: Date
}

const createGameOverviewFilter = (now: Date) => {
  const from = new Date(now.getTime() - GAMES_FILTER_PAST_DURATION_IN_SECONDS * 1_000)
  const until = new Date(now.getTime() + GAMES_FILTER_PAST_DURATION_IN_SECONDS * 1_000)

  return {
    from: from,
    until: until,
  } as GamesFilter
}

interface GameListProps {
  games: GameStartEvent[]
  currentGameId?: string
}

function GameList(props: GameListProps) {
  return (
    <>
      <div className="w-full max-w-md rounded-lg ">
        <div className="grid justify-items-center items-center gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {props.games.map((game) => {
            const isCurrentGame = game.id === props.currentGameId
            return (
              <div key={game.id} className="w-full max-w-sm">
                <GameCard game={game} isCurrentGame={isCurrentGame} />
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

export default function LobbyPage() {
  const renderedAt = new Date()
  const settings = useSettings()
  const incomingNostr = useIncomingNostrEvents()
  const gameStore = useGameStore()
  const [gameStartEventFilter, setGameStartEventFilter] = useState(createGameOverviewFilter(new Date()))
  const currentGameId = useMemo(
    () => settings.currentGameJesterId && jesterIdToGameId(settings.currentGameJesterId),
    [settings]
  )

  const publicKeyOrNull = useMemo(() => settings.identity?.pubkey || null, [settings])
  const privateKeyOrNull = getSession()?.privateKey || null

  const privateStartGameRef = useMemo(
    () => publicKeyOrNull && jesterPrivateStartGameRef(publicKeyOrNull),
    [publicKeyOrNull]
  )

  const [tick, setTick] = useState<number>(Date.now())

  useEffect(() => {
    setGameStartEventFilter(createGameOverviewFilter(new Date()))
  }, [tick])

  useEffect(() => {
    const abortCtrl = new AbortController()
    const timer = setInterval(
      () => !abortCtrl.signal.aborted && setTick((_) => Date.now()),
      MIN_UPDATE_IN_SECONDS * 1_000
    )
    return () => {
      clearInterval(timer)
      abortCtrl.abort()
    }
  }, [])

  const listOfStartGamesLiveQuery = useLiveQuery(
    async () => {
      const events = await gameStore.game_start
        .where('created_at')
        .between(gameStartEventFilter.from.getTime() / 1_000, gameStartEventFilter.until.getTime() / 1_000)
        .limit(MAX_AMOUNT_OF_GAMES)
        .toArray()

      return events
    },
    [gameStartEventFilter],
    null
  )

  const listOfStartGames = useMemo(() => {
    return listOfStartGamesLiveQuery ? [...listOfStartGamesLiveQuery] : []
  }, [listOfStartGamesLiveQuery])

  const listOfPrivateStartGamesLiveQuery = useLiveQuery(
    async () => {
      if (!privateStartGameRef) return null
      const events = await gameStore.game_start.where('event_tags').equals(privateStartGameRef).limit(3).toArray()

      return events
    },
    [privateStartGameRef],
    null
  )

  useEffect(() => {
    const previousTitle = document.title
    if (!listOfStartGamesLiveQuery || listOfStartGamesLiveQuery.length === 0) {
      document.title = `Lobby`
    } else {
      document.title = `Lobby (${listOfStartGamesLiveQuery.length})`
    }

    return () => {
      document.title = previousTitle
    }
  }, [listOfStartGamesLiveQuery])

  return (
    <div className="screen-games-overview">
      {!incomingNostr ? (
        <NoConnectionAlert />
      ) : (
        <>
          <div className="flex justify-center my-4">
            {!settings.currentGameJesterId ? (
              <GameStartOrNewIdentityButton hasPrivateKey={!!privateKeyOrNull} />
            ) : (
              <GameById jesterId={settings.currentGameJesterId}>
                {(game) => {
                  if (game === undefined) {
                    return <Spinner />
                  } else if (game === null) {
                    return <GameStartOrNewIdentityButton hasPrivateKey={!!privateKeyOrNull} />
                  } else {
                    return <></>
                  }
                }}
              </GameById>
            )}
          </div>

          {process.env.NODE_ENV === 'development' && settings.dev && (
            <div className="my-4">
              <CreateDevelGameButton
                onGameCreated={(e, jesterId) => {
                  window.alert(`Published game ${jesterId}`)
                }}
              />
              <CreateMultipleGamesButton amount={21} />
            </div>
          )}

          {listOfPrivateStartGamesLiveQuery && listOfPrivateStartGamesLiveQuery.length > 0 && (
            <>
              <div className="my-4">
                <Heading6 color="blueGray">
                  Direct Challenges ({listOfPrivateStartGamesLiveQuery?.length || 0})
                </Heading6>
              </div>
              <div className="my-4">
                <GameList games={listOfPrivateStartGamesLiveQuery || []} currentGameId={currentGameId} />
              </div>
            </>
          )}

          {
            <div className="my-4">
              <Heading6 color="blueGray">Latest Games</Heading6>
              {listOfStartGames?.length || 0} games available
              <Small color="yellow"> on {renderedAt.toLocaleString()}</Small>
              <Small color="gray"> from {gameStartEventFilter.from.toLocaleString()}</Small>
              <Small color="gray"> to {gameStartEventFilter.until.toLocaleString()}</Small>
            </div>
          }
          <div className="my-4">
            <GameList games={listOfStartGames || []} currentGameId={currentGameId} />
          </div>
        </>
      )}
    </div>
  )
}

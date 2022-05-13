import React, { useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'

import { AppSettings, useSettingsDispatch } from '../context/SettingsContext'

import { GameRedirectButtonHook } from '../components/CreateGameButton'
import { RoboHashImg } from '../components/RoboHashImg'
import { GameDetails } from '../components/jester/GameDetails'

import * as JesterUtils from '../util/jester'
import * as AppUtils from '../util/app'
import { GameStartEvent } from '../util/app_db'

// @ts-ignore
import Small from '@material-tailwind/react/Small'
// @ts-ignore
import Button from '@material-tailwind/react/Button'
// @ts-ignore
import Icon from '@material-tailwind/react/Icon'

interface GameCardProps {
  game: GameStartEvent
}

export function GameCard({ game }: GameCardProps) {
  const redirectToGameButtonRef = useRef<HTMLButtonElement>(null)
  const [jesterId] = useState(JesterUtils.gameIdToJesterId(game.id))

  const displayJesterId = AppUtils.displayJesterIdShort(jesterId)

  return (
    <GameDetails game={game}>
      {({ moveCount, player1PubKey, player2PubKey }) => {
        const displayPlayer1PubKey = AppUtils.pubKeyDisplayName(player1PubKey)
        const displayPlayer2PubKey = player2PubKey && AppUtils.pubKeyDisplayName(player2PubKey)
        return (
          <Link to={`/game/${jesterId}`} className="w-full max-w-sm">
            <div className="rounded-lg border border-gray-800 shadow-sm hover:shadow-xl transform duration-300 hover:transform-scale-103">
              <div className="flex flex-col items-center pb-4 pt-4">
                <div className="flex items-center justify-center w-full">
                  <h6 className="text-blue-gray-500 font-serif font-bold leading-normal mt-0 mb-1">
                    {displayJesterId}
                  </h6>
                </div>

                <div className="flex items-center sm:space-x-4 space-x-2 my-4">
                  <RoboHashImg
                    className="w-24 h-24 rounded-full shadow-lg-gray bg-blue-gray-500"
                    value={player1PubKey}
                    alt={displayPlayer1PubKey}
                  />
                  <div className="text-xl font-medium">vs.</div>
                  {player2PubKey && displayPlayer2PubKey ? (
                    <RoboHashImg
                      className="w-24 h-24 rounded-full shadow-lg-gray bg-blue-gray-500"
                      value={player2PubKey}
                      alt={displayPlayer2PubKey}
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full shadow-lg-gray bg-blue-gray-500 flex justify-center items-center">
                      <Icon name="question_mark" size="xxl" />
                    </div>
                  )}
                </div>

                {/*
                <div className="mb-1">
                  <code className="border border-solid border-blue-gray-500 text-xs font-semibold mx-1 px-2.5 py-1 rounded">
                    {displayJesterId}
                  </code>
                </div>
              */}
                <span className="mb-1 text-sm text-gray-400">
                  with {moveCount === null ? ' ... ' : `${moveCount}`} {moveCount === 1 ? 'move' : 'moves'}
                </span>
                <span className="mb-1 text-sm text-gray-400">
                  <Small color="yellow"> Started at {new Date(game.created_at * 1_000).toLocaleString()}</Small>
                </span>
                <div className="px-4 mt-2 w-full">
                  <Button
                    color="green"
                    buttonType="filled"
                    size="regular"
                    rounded={false}
                    block={true}
                    iconOnly={false}
                    ripple="dark"
                    ref={redirectToGameButtonRef}
                  >
                    Play
                    <GameRedirectButtonHook buttonRef={redirectToGameButtonRef} jesterId={jesterId} />
                  </Button>
                </div>
              </div>
            </div>
          </Link>
        )
      }}
    </GameDetails>
  )
}

interface CurrentGameCardProps {
  game: GameStartEvent
  title?: string
}

export function CurrentGameCard({ game, title = 'Current Game' }: CurrentGameCardProps) {
  const settingsDispatch = useSettingsDispatch()
  const redirectToGameButtonRef = useRef<HTMLButtonElement>(null)
  const [jesterId] = useState(JesterUtils.gameIdToJesterId(game.id))

  const unsubscribeFromCurrentGame = useCallback(() => {
    settingsDispatch({ currentGameJesterId: undefined } as AppSettings)
  }, [settingsDispatch])

  return (
    <GameDetails game={game}>
      {({ moveCount, player1PubKey, player2PubKey }) => {
        const displayPlayer1PubKey = AppUtils.pubKeyDisplayName(player1PubKey)
        const displayPlayer2PubKey = player2PubKey && AppUtils.pubKeyDisplayName(player2PubKey)
        return (
          <Link to={`/game/${jesterId}`} className="w-full max-w-sm">
            <div className="rounded-lg border border-gray-800 shadow-sm hover:shadow-xl transform duration-300 hover:transform-scale-103">
              <div className="flex flex-col items-center pb-4 pt-4">
                <div className="flex items-center w-full">
                  <div className="flex-none w-14"></div>
                  <div className="grow flex justify-center">
                    <h6 className="text-blue-gray-500 text-xl font-serif font-bold leading-normal mt-0 mb-1">
                      {title}
                    </h6>
                  </div>
                  <div className="flex-none w-14">
                    <Button
                      color="gray"
                      buttonType="link"
                      size="regular"
                      rounded={false}
                      block={false}
                      iconOnly={true}
                      ripple="light"
                      onClick={(e: React.MouseEvent) => {
                        e.preventDefault()
                        unsubscribeFromCurrentGame()
                      }}
                    >
                      <Icon name="close" size="xl" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center sm:space-x-4 space-x-2 my-4">
                  <RoboHashImg
                    className="w-24 h-24 rounded-full shadow-lg-gray bg-blue-gray-500"
                    value={player1PubKey}
                    alt={displayPlayer1PubKey}
                  />
                  <div className="text-xl font-medium">vs.</div>
                  {player2PubKey && displayPlayer2PubKey ? (
                    <RoboHashImg
                      className="w-24 h-24 rounded-full shadow-lg-gray bg-blue-gray-500"
                      value={player2PubKey}
                      alt={displayPlayer2PubKey}
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full shadow-lg-gray bg-blue-gray-500 flex justify-center items-center">
                      <Icon name="question_mark" size="xxl" />
                    </div>
                  )}
                </div>

                {/*
                <div className="mb-1">
                  <code className="border border-solid border-blue-gray-500 text-xs font-semibold mx-1 px-2.5 py-1 rounded">
                    {displayJesterId}
                  </code>
                </div>
              */}
                <span className="mb-1 text-sm text-gray-400">
                  with {moveCount === null ? ' ... ' : `${moveCount}`} {moveCount === 1 ? 'move' : 'moves'}
                </span>
                <span className="mb-1 text-sm text-gray-400">
                  <Small color="yellow"> Started at {new Date(game.created_at * 1_000).toLocaleString()}</Small>
                </span>
                <div className="px-4 mt-2 w-full">
                  <Button
                    color="green"
                    buttonType="filled"
                    size="regular"
                    rounded={false}
                    block={true}
                    iconOnly={false}
                    ripple="dark"
                    ref={redirectToGameButtonRef}
                  >
                    Play
                    <GameRedirectButtonHook buttonRef={redirectToGameButtonRef} jesterId={jesterId} />
                  </Button>
                </div>
              </div>
            </div>
          </Link>
        )
      }}
    </GameDetails>
  )
}
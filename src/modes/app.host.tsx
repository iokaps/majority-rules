import { config } from '@/config';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useGlobalController } from '@/hooks/useGlobalController';
import { useServerTimer } from '@/hooks/useServerTime';
import { generateLink } from '@/kit/generate-link';
import { HostPresenterLayout } from '@/layouts/host-presenter';
import { kmClient } from '@/services/km-client';
import { globalActions } from '@/state/actions/global-actions';
import { globalStore } from '@/state/stores/global-store';
import { cn } from '@/utils/cn';
import { QuestionManagementView } from '@/views/question-management-view';
import { VotingView } from '@/views/voting-view';
import { useSnapshot } from '@kokimoki/app';
import { CirclePlay, CircleStop, SquareArrowOutUpRight } from 'lucide-react';
import * as React from 'react';

const App: React.FC = () => {
	useGlobalController();
	const { title } = config;
	const {
		started,
		showPresenterQr,
		gamePhase,
		roundNumber,
		questionBank,
		usedQuestionIds,
		currentQuestion,
		players,
		votingEndTimestamp,
		votes,
		playerTopicsEnabled
	} = useSnapshot(globalStore.proxy);
	const serverTime = useServerTimer(250);
	const [buttonCooldown, setButtonCooldown] = React.useState(true);
	const [selectedQuestionId, setSelectedQuestionId] = React.useState<
		string | null
	>(null);

	useDocumentTitle(title);

	// Button cooldown to prevent accidentally spamming start/stop
	React.useEffect(() => {
		setButtonCooldown(true);
		const timeout = setTimeout(() => {
			setButtonCooldown(false);
		}, 1000);

		return () => clearTimeout(timeout);
	}, [started, gamePhase]);

	if (kmClient.clientContext.mode !== 'host') {
		throw new Error('App host rendered in non-host mode');
	}

	const playerLink = generateLink(kmClient.clientContext.playerCode, {
		mode: 'player'
	});

	const presenterLink = generateLink(kmClient.clientContext.presenterCode, {
		mode: 'presenter',
		playerCode: kmClient.clientContext.playerCode
	});

	// Count players who have voted
	const activePlayers = Object.values(players).length;
	const votedPlayers = Object.keys(votes).length;

	const handleStartGame = async () => {
		await globalActions.startGame();
	};

	const handleStartRound = async () => {
		if (!selectedQuestionId) return;
		await globalActions.startRound(selectedQuestionId);
	};

	const handleRevealResults = async () => {
		await globalActions.revealResults();
	};

	const handleAdvanceRound = async () => {
		await globalActions.advanceRound();
	};

	const handleStopGame = async () => {
		await globalActions.stopGame();
	};

	const handleEndGame = async () => {
		await globalActions.endGame();
	};

	// Main game view
	if (started) {
		return (
			<HostPresenterLayout.Root>
				<HostPresenterLayout.Header>
					<div className="text-sm font-semibold text-slate-600">
						{config.hostRoundPlayersLabel
							.replace('{roundNumber}', roundNumber.toString())
							.replace('{activePlayers}', activePlayers.toString())}
					</div>
				</HostPresenterLayout.Header>

				<HostPresenterLayout.Main>
					<div className="grid gap-6 lg:grid-cols-3">
						{/* Current Question / Status */}
						<div className="lg:col-span-2">
							{gamePhase === 'lobby' && questionBank.length > 0 ? (
								<div className="space-y-4">
									<h2 className="font-semibold text-slate-900">
										{config.hostSelectQuestion}
									</h2>
									<div className="space-y-2">
										{questionBank.map((q) => (
											<button
												key={q.id}
												onClick={() => setSelectedQuestionId(q.id)}
												className={cn(
													'game-card w-full text-left transition-all',
													selectedQuestionId === q.id &&
														'border-blue-500 ring-2 ring-blue-500'
												)}
											>
												<div className="flex items-start justify-between gap-3">
													<div className="flex-1">
														<p className="font-semibold text-slate-900">
															{q.text}
														</p>
														<p className="text-xs text-slate-600">
															{q.options.join(' • ')}
														</p>
													</div>
													{usedQuestionIds.includes(q.id) && (
														<span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
															{config.hostPlayedBadge}
														</span>
													)}
												</div>
											</button>
										))}
									</div>
								</div>
							) : gamePhase === 'voting' ? (
								<div className="space-y-4">
									<div className="game-card">
										<h2 className="game-question mb-4 text-center">
											{currentQuestion?.text}
										</h2>
										<p className="text-center text-lg font-semibold text-slate-900">
											{config.hostVotingProgress
												.replace('{votedPlayers}', votedPlayers.toString())
												.replace('{activePlayers}', activePlayers.toString())}
										</p>
									</div>
									<div className="rounded-xl bg-blue-50 p-4">
										<p className="text-sm font-semibold text-blue-900">
											Time remaining:{' '}
										</p>
										<p className="text-2xl font-bold text-blue-600">
											{Math.ceil(
												Math.max(0, votingEndTimestamp - serverTime) / 1000
											)}
											s
										</p>
									</div>
								</div>
							) : gamePhase === 'results' ? (
								<VotingView interactive={false} />
							) : gamePhase === 'game-over' ? (
								<div className="game-card text-center">
									<h2 className="game-question mb-4">
										{config.hostGameOverTitle}
									</h2>
									<div className="space-y-3">
										{Object.entries(players)
											.map(([, p]) => ({
												name: p.name,
												score: p.score
											}))
											.sort((a, b) => b.score - a.score)
											.map((p) => (
												<div key={p.name} className="font-semibold">
													{p.name}: {p.score} points
												</div>
											))}
									</div>
								</div>
							) : null}
						</div>

						<div className="rounded-xl border border-slate-200 bg-white p-4">
							<h3 className="mb-4 font-semibold text-slate-900">
								{config.hostPlayersLabel}
							</h3>
							<div className="space-y-2">
								{Object.values(players).map((player) => (
									<div
										key={player.name}
										className="rounded-lg bg-slate-100 px-3 py-2 text-slate-900"
									>
										<div className="flex items-center justify-between">
											<div className="flex-1">
												<p className="text-sm font-semibold">{player.name}</p>
											</div>
											<div className="text-right">
												<p className="text-sm font-bold">{player.score}</p>
												{gamePhase === 'voting' && (
													<p className="text-xs text-slate-600">
														{player.hasVoted
															? config.hostVotedLabel
															: config.hostWaitingLabel}
													</p>
												)}
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</HostPresenterLayout.Main>

				<HostPresenterLayout.Footer>
					<div className="inline-flex flex-wrap gap-3">
						{gamePhase === 'lobby' && (
							<button
								type="button"
								className="km-btn-primary"
								onClick={handleStartRound}
								disabled={buttonCooldown || !selectedQuestionId}
							>
								<CirclePlay className="size-5" />
								{config.hostStartRoundButton}
							</button>
						)}

						{gamePhase === 'voting' && (
							<button
								type="button"
								className="km-btn-primary"
								onClick={handleRevealResults}
								disabled={buttonCooldown}
							>
								{config.hostRevealResultsButton}
							</button>
						)}

						{gamePhase === 'results' && (
							<button
								type="button"
								className="km-btn-primary"
								onClick={handleAdvanceRound}
								disabled={buttonCooldown}
							>
								{config.hostNextRoundButton}
							</button>
						)}

						{(gamePhase === 'voting' || gamePhase === 'results') && (
							<button
								type="button"
								className="km-btn-error"
								onClick={handleEndGame}
								disabled={buttonCooldown}
							>
								{config.hostEndGameButton}
							</button>
						)}

						<button
							type="button"
							className="km-btn-error"
							onClick={handleStopGame}
							disabled={buttonCooldown}
						>
							<CircleStop className="size-5" />
							{config.hostStopGameButton}
						</button>

						<a
							href={playerLink}
							target="_blank"
							rel="noreferrer"
							className="km-btn-secondary"
						>
							{config.playerLinkLabel}
							<SquareArrowOutUpRight className="size-5" />
						</a>

						<a
							href={presenterLink}
							target="_blank"
							rel="noreferrer"
							className="km-btn-secondary"
						>
							{config.presenterLinkLabel}
							<SquareArrowOutUpRight className="size-5" />
						</a>
					</div>
				</HostPresenterLayout.Footer>
			</HostPresenterLayout.Root>
		);
	}

	// Pregame - show question manager
	return (
		<HostPresenterLayout.Root>
			<HostPresenterLayout.Header />

			<HostPresenterLayout.Main>
				<QuestionManagementView onQuestionAdded={setSelectedQuestionId} />
			</HostPresenterLayout.Main>

			<HostPresenterLayout.Footer>
				<div className="inline-flex flex-wrap gap-4">
					<button
						type="button"
						className="km-btn-primary"
						onClick={handleStartGame}
						disabled={buttonCooldown}
					>
						<CirclePlay className="size-5" />
						{config.startButton}
					</button>

					<button
						type="button"
						className={
							playerTopicsEnabled ? 'km-btn-primary' : 'km-btn-secondary'
						}
						onClick={globalActions.togglePlayerTopics}
					>
						{playerTopicsEnabled
							? config.playerTopicsEnabledLabel
							: config.playerTopicsDisabledLabel}
					</button>

					<button
						type="button"
						className={showPresenterQr ? 'km-btn-neutral' : 'km-btn-secondary'}
						onClick={globalActions.togglePresenterQr}
					>
						{config.togglePresenterQrButton}
					</button>

					<a
						href={playerLink}
						target="_blank"
						rel="noreferrer"
						className="km-btn-secondary"
					>
						{config.playerLinkLabel}
						<SquareArrowOutUpRight className="size-5" />
					</a>

					<a
						href={presenterLink}
						target="_blank"
						rel="noreferrer"
						className="km-btn-secondary"
					>
						{config.presenterLinkLabel}
						<SquareArrowOutUpRight className="size-5" />
					</a>
				</div>
			</HostPresenterLayout.Footer>
		</HostPresenterLayout.Root>
	);
};

export default App;

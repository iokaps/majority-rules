import { CircularTimer } from '@/components/circular-timer';
import { withKmProviders } from '@/components/with-km-providers';
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
import { useKmModal } from '@kokimoki/shared';
import {
	CirclePlay,
	CircleStop,
	Info,
	SquareArrowOutUpRight
} from 'lucide-react';
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

	const { openDrawer } = useKmModal();

	const handleShowInfo = () => {
		openDrawer({
			title: config.hostInfoTitle,
			content: (
				<div className="space-y-4">
					<div>
						<h3 className="mb-2 font-semibold text-slate-900">
							{config.hostInfoGameGoalTitle}
						</h3>
						<p className="text-slate-700">{config.hostInfoGameGoalText}</p>
					</div>

					<div>
						<h3 className="mb-2 font-semibold text-slate-900">
							{config.hostInfoConfidenceTitle}
						</h3>
						<p className="mb-2 text-slate-700">
							{config.hostInfoConfidenceText}
						</p>
						<ul className="ml-4 space-y-1 text-slate-700">
							<li>
								<strong>Left (0.5x)</strong>: {config.hostInfoConfidenceLeft}
							</li>
							<li>
								<strong>Middle (1x)</strong>: {config.hostInfoConfidenceMiddle}
							</li>
							<li>
								<strong>Right (3x)</strong>: {config.hostInfoConfidenceRight}
							</li>
						</ul>
					</div>

					<div>
						<h3 className="mb-2 font-semibold text-slate-900">
							{config.hostInfoScoringTitle}
						</h3>
						<p className="mb-2 text-slate-700">
							<strong>{config.hostInfoScoringWinning}</strong>
						</p>
						<p className="mb-2 ml-4 text-slate-700">
							{config.hostInfoScoringFormula}
						</p>
						<p className="mb-2 text-slate-700">
							<strong>Consensus Bonus:</strong>{' '}
							{config.hostInfoScoringConsensus}
						</p>
						<p className="mb-4 text-slate-700">
							<strong>Losing (Minority Vote):</strong>{' '}
							{config.hostInfoScoringLosing}
						</p>
					</div>

					<div>
						<h3 className="mb-2 font-semibold text-slate-900">
							Player Feedback
						</h3>
						<p className="text-slate-700">
							Players see a <strong>countdown timer</strong> during voting and{' '}
							<strong>immediate visual feedback</strong> of points earned/lost
							(+/- color coding) after each round.
						</p>
					</div>

					<div>
						<h3 className="mb-2 font-semibold text-slate-900">
							{config.hostInfoTiesTitle}
						</h3>
						<p className="text-slate-700">{config.hostInfoTiesText}</p>
					</div>

					<div>
						<h3 className="mb-2 font-semibold text-slate-900">
							{config.hostInfoGameEndTitle}
						</h3>
						<p className="text-slate-700">
							{config.hostInfoGameEndText.replace(
								'{maxRounds}',
								config.maxRounds.toString()
							)}
						</p>
					</div>
				</div>
			)
		});
	};

	// Main game view
	if (started) {
		return (
			<HostPresenterLayout.Root>
				<HostPresenterLayout.Header>
					{' '}
					<button
						type="button"
						onClick={handleShowInfo}
						className="inline-flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-200"
						aria-label="Game information"
					>
						<Info className="size-4" />
						{config.hostInfoButtonLabel}
					</button>
					<div className="flex flex-col gap-2">
						<div className="text-sm font-semibold text-slate-600">
							{config.hostRoundPlayersLabel
								.replace('{roundNumber}', roundNumber.toString())
								.replace('{activePlayers}', activePlayers.toString())}
						</div>
						{gamePhase === 'voting' && activePlayers > 0 && (
							<div className="flex items-center gap-2">
								<div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
									<div
										className="gradient-success h-full transition-all duration-300"
										style={{
											width: `${activePlayers > 0 ? (votedPlayers / activePlayers) * 100 : 0}%`
										}}
									/>
								</div>
								<span className="text-xs font-medium whitespace-nowrap text-slate-600">
									{votedPlayers}/{activePlayers}
								</span>
							</div>
						)}
					</div>
				</HostPresenterLayout.Header>

				<HostPresenterLayout.Main>
					<div
						className={cn(
							'grid gap-6',
							gamePhase === 'game-over'
								? 'grid-cols-1'
								: 'grid-cols-3 lg:grid-cols-4'
						)}
					>
						{/* Current Question / Status - Main Content */}
						<div
							className={cn(
								gamePhase === 'game-over' ? '' : 'col-span-3 lg:col-span-3'
							)}
						>
							{gamePhase === 'lobby' && questionBank.length > 0 ? (
								<div className="space-y-2">
									<h2 className="text-sm font-semibold text-slate-900">
										{config.hostSelectQuestion}
									</h2>
									<div className="grid gap-2 lg:grid-cols-2">
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
												<div className="flex items-start justify-between gap-2">
													<div className="flex-1">
														<p className="text-sm font-semibold text-slate-900">
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
							) : gamePhase === 'voting' || gamePhase === 'results' ? (
								<div className="space-y-3">
									{gamePhase === 'voting' && (
										<>
											<div className="game-card-compact">
												<h2 className="game-question-compact mb-3 text-center">
													{currentQuestion?.text}
												</h2>
											</div>
											<div className="flex justify-center">
												<CircularTimer
													ms={Math.max(0, votingEndTimestamp - serverTime)}
													totalMs={config.votingDurationSeconds * 1000}
													size={120}
													strokeWidth={10}
												/>
											</div>
										</>
									)}
									{gamePhase === 'results' && (
										<VotingView interactive={false} />
									)}
								</div>
							) : gamePhase === 'game-over' ? (
								<div className="game-card-compact text-center">
									<h2 className="game-question-compact mb-3">
										{config.hostGameOverTitle}
									</h2>
									<div className="space-y-2">
										{Object.entries(players)
											.map(([, p]) => ({
												name: p.name,
												score: p.score
											}))
											.sort((a, b) => b.score - a.score)
											.map((p) => (
												<div key={p.name} className="text-sm font-semibold">
													{p.name}: {p.score} points
												</div>
											))}
									</div>
								</div>
							) : null}
						</div>

						{/* Players Panel - Right Side */}
						{gamePhase !== 'game-over' && (
							<div className="sticky top-24 h-fit rounded-xl border border-slate-200 bg-white p-3">
								<h3 className="mb-3 text-sm font-semibold text-slate-900">
									{config.hostPlayersLabel}
								</h3>
								<div className="max-h-96 space-y-2 overflow-y-auto">
									{Object.values(players).map((player) => (
										<div
											key={player.name}
											className="rounded-lg bg-slate-100 px-2 py-1 text-slate-900"
										>
											<div className="flex items-center justify-between gap-1">
												<div className="flex-1 truncate">
													<p className="truncate text-xs font-semibold">
														{player.name}
													</p>
												</div>
												<div className="flex-shrink-0 text-right">
													<p className="text-xs font-bold">{player.score}</p>
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
						)}
					</div>
				</HostPresenterLayout.Main>

				<HostPresenterLayout.Footer>
					<div className="inline-flex flex-wrap gap-2">
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
				<div className="inline-flex flex-wrap gap-2">
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

export default withKmProviders(App);

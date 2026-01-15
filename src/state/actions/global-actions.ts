import { config } from '@/config';
import { kmClient } from '@/services/km-client';
import type { Question } from '../stores/global-store';
import { globalStore } from '../stores/global-store';

export const globalActions = {
	async startGame() {
		await kmClient.transact([globalStore], ([globalState]) => {
			globalState.started = true;
			globalState.startTimestamp = kmClient.serverTimestamp();
			globalState.roundNumber = 0;
			globalState.usedQuestionIds = [];

			// Initialize all players with starting lives
			for (const clientId of Object.keys(globalState.players)) {
				globalState.players[clientId] = {
					...globalState.players[clientId],
					score: 0,
					lives: config.playerStartingLives,
					isSpectator: false,
					hasVoted: false
				};
			}

			// Auto-select and start first round with first available question
			if (globalState.questionBank.length > 0) {
				// Try to find first unplayed question
				let question = globalState.questionBank.find(
					(q) => !globalState.usedQuestionIds.includes(q.id)
				);

				// If all played, use first question
				if (!question) {
					question = globalState.questionBank[0];
				}

				// Start round with selected question
				globalState.currentQuestion = question;
				globalState.gamePhase = 'question-display';
				globalState.roundNumber = 1;
				globalState.votes = {};
				globalState.voteAggregation = {};
				globalState.votingEndTimestamp = 0;

				// Track used question
				if (!globalState.usedQuestionIds.includes(question.id)) {
					globalState.usedQuestionIds.push(question.id);
				}

				// Reset hasVoted flag for all players
				for (const clientId of Object.keys(globalState.players)) {
					globalState.players[clientId].hasVoted = false;
				}
			} else {
				// No questions available, stay in lobby
				globalState.gamePhase = 'lobby';
			}
		});
	},

	async stopGame() {
		await kmClient.transact([globalStore], ([globalState]) => {
			globalState.started = false;
			globalState.startTimestamp = 0;
			globalState.gamePhase = 'lobby';
			globalState.usedQuestionIds = [];
		});
	},

	async togglePresenterQr() {
		await kmClient.transact([globalStore], ([globalState]) => {
			globalState.showPresenterQr = !globalState.showPresenterQr;
		});
	},

	async addQuestionToBank(question: Question) {
		await kmClient.transact([globalStore], ([globalState]) => {
			globalState.questionBank.push(question);
		});
	},

	async removeQuestionFromBank(questionId: string) {
		await kmClient.transact([globalStore], ([globalState]) => {
			globalState.questionBank = globalState.questionBank.filter(
				(q) => q.id !== questionId
			);
		});
	},

	async updateQuestion(questionId: string, updates: Partial<Question>) {
		await kmClient.transact([globalStore], ([globalState]) => {
			const question = globalState.questionBank.find(
				(q) => q.id === questionId
			);
			if (question) {
				Object.assign(question, updates);
			}
		});
	},

	async startRound(questionId: string) {
		await kmClient.transact([globalStore], ([globalState]) => {
			const question = globalState.questionBank.find(
				(q) => q.id === questionId
			);
			if (!question) return;

			globalState.currentQuestion = question;
			globalState.gamePhase = 'question-display';
			globalState.roundNumber += 1;
			globalState.votes = {};
			globalState.voteAggregation = {};
			globalState.votingEndTimestamp = 0;

			// Track used question
			if (!globalState.usedQuestionIds.includes(questionId)) {
				globalState.usedQuestionIds.push(questionId);
			}

			// Reset hasVoted flag for all players
			for (const clientId of Object.keys(globalState.players)) {
				globalState.players[clientId].hasVoted = false;
			}
		});
	},

	async startVoting() {
		await kmClient.transact([globalStore], ([globalState]) => {
			globalState.gamePhase = 'voting';
			globalState.votingEndTimestamp =
				kmClient.serverTimestamp() + config.votingDurationSeconds * 1000;
		});
	},

	async submitVote(optionIndex: number, confidence: number) {
		await kmClient.transact([globalStore], ([globalState]) => {
			if (globalState.gamePhase !== 'voting') return;

			globalState.votes[kmClient.id] = {
				optionIndex,
				confidence
			};
			globalState.players[kmClient.id].hasVoted = true;
		});
	},

	async revealResults() {
		await kmClient.transact([globalStore], ([globalState]) => {
			if (!globalState.currentQuestion) return;

			// Aggregate votes
			const aggregation: Record<number, number> = {};
			for (let i = 0; i < globalState.currentQuestion.options.length; i++) {
				aggregation[i] = 0;
			}

			for (const vote of Object.values(globalState.votes)) {
				aggregation[vote.optionIndex]++;
			}

			globalState.voteAggregation = aggregation;

			// Find max vote count
			const maxVotes = Math.max(...Object.values(aggregation), 0);

			// Determine winning options (all options with max votes win - ties all win)
			const winningOptionIndices = Object.entries(aggregation)
				.filter(([, count]) => count === maxVotes && maxVotes > 0)
				.map(([index]) => parseInt(index, 10));

			// Calculate scores and eliminate
			const totalVotes = Object.keys(globalState.votes).length;
			const secondMaxVotes =
				maxVotes > 0
					? Math.max(
							...Object.values(aggregation).filter((count) => count < maxVotes),
							0
						)
					: 0;
			const votingMargin =
				totalVotes > 0 ? ((maxVotes - secondMaxVotes) / totalVotes) * 100 : 0;

			// Margin bonus formula: (100 - margin) / 50, capped at 2x
			const marginBonus = Math.min((100 - votingMargin) / 50, 2);

			for (const [clientId, vote] of Object.entries(globalState.votes)) {
				const player = globalState.players[clientId];
				if (!player || player.isSpectator) continue;

				const isWinner = winningOptionIndices.includes(vote.optionIndex);

				if (isWinner) {
					// Award points
					const points = Math.round(
						config.baseScorePoints * vote.confidence * marginBonus
					);
					player.score += points;
				} else {
					// Lose 1 life
					player.lives -= 1;
					if (player.lives <= 0) {
						player.isSpectator = true;
					}
				}
			}

			// Auto-submit timeout votes (players who didn't vote)
			const votedPlayers = new Set(Object.keys(globalState.votes));
			for (const [clientId, player] of Object.entries(globalState.players)) {
				if (!votedPlayers.has(clientId) && !player.isSpectator) {
					// Timeout = loss of 1 life
					player.lives -= 1;
					if (player.lives <= 0) {
						player.isSpectator = true;
					}
				}
			}

			globalState.gamePhase = 'results';
		});
	},

	async advanceRound() {
		await kmClient.transact([globalStore], ([globalState]) => {
			// Count active (non-spectator) players
			const activePlayers = Object.values(globalState.players).filter(
				(p) => !p.isSpectator
			);

			if (activePlayers.length <= 1) {
				globalState.gamePhase = 'game-over';
			} else {
				globalState.gamePhase = 'lobby';
			}
		});
	},

	async setAiGenerationStatus(status: 'idle' | 'generating' | 'ready') {
		await kmClient.transact([globalStore], ([globalState]) => {
			globalState.aiGenerationStatus = status;
		});
	},

	async clearAllQuestions() {
		await kmClient.transact([globalStore], ([globalState]) => {
			globalState.questionBank = [];
		});
	},

	async generateAndStartRound() {
		try {
			// Set generating status
			await kmClient.transact([globalStore], ([globalState]) => {
				globalState.aiGenerationStatus = 'generating';
			});

			// Generate AI question with exactly 3 options
			const aiOptionCount = 3;
			const userPrompt = config.aiQuestionPrompt.replace(
				'{{optionCount}}',
				aiOptionCount.toString()
			);

			const response = await kmClient.ai.generateJson<{
				question: string;
				options: string[];
			}>({ userPrompt });

			const typedResponse = response as {
				question: string;
				options: string[];
			};

			// Create new question
			const newQuestion: Question = {
				id: `q-${Date.now()}`,
				text: typedResponse.question,
				options: typedResponse.options,
				isAiGenerated: true
			};

			// Add to bank and start round
			await kmClient.transact([globalStore], ([globalState]) => {
				globalState.questionBank.push(newQuestion);
				globalState.aiGenerationStatus = 'idle';

				// Start round with the new question
				globalState.currentQuestion = newQuestion;
				globalState.gamePhase = 'question-display';
				globalState.roundNumber += 1;
				globalState.votes = {};
				globalState.voteAggregation = {};
				globalState.votingEndTimestamp = 0;

				// Track used question
				if (!globalState.usedQuestionIds.includes(newQuestion.id)) {
					globalState.usedQuestionIds.push(newQuestion.id);
				}

				// Reset hasVoted flag for all players
				for (const clientId of Object.keys(globalState.players)) {
					globalState.players[clientId].hasVoted = false;
				}
			});
		} catch (error) {
			console.error('Failed to generate question:', error);
			// Reset status on error
			await kmClient.transact([globalStore], ([globalState]) => {
				globalState.aiGenerationStatus = 'idle';
			});
			throw error;
		}
	},

	async togglePlayerTopics() {
		await kmClient.transact([globalStore], ([globalState]) => {
			globalState.playerTopicsEnabled = !globalState.playerTopicsEnabled;
		});
	},

	async submitPlayerTopic(topic: string, playerName: string) {
		await kmClient.transact([globalStore], ([globalState]) => {
			if (!topic.trim()) return;

			// Prevent submitting if player already has a topic
			if (globalState.playerTopics[kmClient.id]) return;

			globalState.playerTopics[kmClient.id] = {
				topic: topic.trim(),
				submittedBy: kmClient.id,
				submittedByName: playerName,
				timestamp: kmClient.serverTimestamp()
			};
		});
	},

	async deletePlayerTopic(topicKey: string) {
		await kmClient.transact([globalStore], ([globalState]) => {
			delete globalState.playerTopics[topicKey];
		});
	},

	async generateQuestionFromTopic(topicKey: string) {
		try {
			const topic = globalStore.proxy.playerTopics[topicKey];
			if (!topic) return;

			await kmClient.transact([globalStore], ([globalState]) => {
				globalState.aiGenerationStatus = 'generating';
			});

			// Generate AI question using the topic

			const userPrompt = config.aiTopicPrompt.replace('{topic}', topic.topic);

			const response = await kmClient.ai.generateJson<{
				question: string;
				options: string[];
			}>({ userPrompt });

			const typedResponse = response as {
				question: string;
				options: string[];
			};

			// Create new question
			const newQuestion: Question = {
				id: `q-${Date.now()}`,
				text: typedResponse.question,
				options: typedResponse.options,
				isAiGenerated: true
			};

			// Add to bank and delete the topic
			await kmClient.transact([globalStore], ([globalState]) => {
				globalState.questionBank.push(newQuestion);
				delete globalState.playerTopics[topicKey];
				globalState.aiGenerationStatus = 'idle';
			});
		} catch (error) {
			console.error('Failed to generate question from topic:', error);
			// Reset status on error
			await kmClient.transact([globalStore], ([globalState]) => {
				globalState.aiGenerationStatus = 'idle';
			});
			throw error;
		}
	}
};

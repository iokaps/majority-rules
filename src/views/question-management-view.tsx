import { config } from '@/config';
import { kmClient } from '@/services/km-client';
import { globalActions } from '@/state/actions/global-actions';
import { globalStore, type Question } from '@/state/stores/global-store';
import { cn } from '@/utils/cn';
import { useSnapshot } from '@kokimoki/app';
import { Plus, Trash2, Wand2 } from 'lucide-react';
import * as React from 'react';

interface QuestionManagementViewProps {
	onQuestionAdded?: (questionId: string) => void;
}

export const QuestionManagementView: React.FC<QuestionManagementViewProps> = ({
	onQuestionAdded
}) => {
	const { questionBank, aiGenerationStatus } = useSnapshot(globalStore.proxy);
	const [showManualForm, setShowManualForm] = React.useState(false);
	const [manualQuestion, setManualQuestion] = React.useState('');
	const [manualOptions, setManualOptions] = React.useState(['', '', '']);
	const [aiTopics, setAiTopics] = React.useState<string[]>(['']);
	const [aiOptionCount, setAiOptionCount] = React.useState(2);
	const [editingId, setEditingId] = React.useState<string | null>(null);
	const [editQuestion, setEditQuestion] = React.useState('');
	const [editOptions, setEditOptions] = React.useState<string[]>([]);
	const [batchProgress, setBatchProgress] = React.useState(0);
	const [totalBatchQuestions, setTotalBatchQuestions] = React.useState(0);

	const generateAiQuestion = async (topic: string) => {
		if (!topic.trim()) return;

		try {
			const userPrompt = config.aiQuestionPrompt.replace(
				'{{optionCount}}',
				aiOptionCount.toString()
			);

			// Append topic to the prompt if provided
			const fullPrompt = topic
				? `${userPrompt}\n\nTopic theme: ${topic}`
				: userPrompt;

			// Call AI with proper request object format per SDK documentation
			const response = await kmClient.ai.generateJson({
				userPrompt: fullPrompt,
				temperature: 0.8
			});

			if (
				response &&
				typeof response === 'object' &&
				'question' in response &&
				'options' in response
			) {
				const typedResponse = response as {
					question: string;
					options: string[];
				};
				if (
					typedResponse.question &&
					Array.isArray(typedResponse.options) &&
					typedResponse.options.length > 0
				) {
					const newQuestion: Question = {
						id: `q-${Date.now()}`,
						text: typedResponse.question,
						options: typedResponse.options.slice(
							0,
							config.maxOptionsPerQuestion
						),
						isAiGenerated: true
					};

					await globalActions.addQuestionToBank(newQuestion);
					// Auto-select the newly added question
					onQuestionAdded?.(newQuestion.id);
					return true;
				}
			}
			return false;
		} catch (error) {
			console.error('Failed to generate question:', error);
			return false;
		}
	};

	const generateBatchQuestions = async () => {
		const validTopics = aiTopics.filter((t) => t.trim());
		if (validTopics.length === 0) return;

		await globalActions.setAiGenerationStatus('generating');
		setTotalBatchQuestions(validTopics.length);
		setBatchProgress(0);

		try {
			for (let i = 0; i < validTopics.length; i++) {
				const success = await generateAiQuestion(validTopics[i]);
				if (success) {
					setBatchProgress(i + 1);
				}
				// Small delay between requests to avoid rate limiting
				await new Promise((resolve) => setTimeout(resolve, 500));
			}

			setAiTopics(['']);
			await globalActions.setAiGenerationStatus('ready');
		} catch (error) {
			console.error('Batch generation failed:', error);
			await globalActions.setAiGenerationStatus('idle');
		} finally {
			setTotalBatchQuestions(0);
			setBatchProgress(0);
		}
	};

	const updateTopic = (index: number, value: string) => {
		const newTopics = [...aiTopics];
		newTopics[index] = value;
		setAiTopics(newTopics);
	};

	const addTopicInput = () => {
		setAiTopics([...aiTopics, '']);
	};

	const removeTopicInput = (index: number) => {
		if (aiTopics.length > 1) {
			setAiTopics(aiTopics.filter((_, i) => i !== index));
		}
	};

	const addManualQuestion = async () => {
		const validOptions = manualOptions.filter((o) => o.trim());
		if (!manualQuestion.trim() || validOptions.length < 2) {
			alert('Please enter a question and at least 2 options');
			return;
		}

		const newQuestion: Question = {
			id: `q-${Date.now()}`,
			text: manualQuestion,
			options: validOptions.slice(0, config.maxOptionsPerQuestion),
			isAiGenerated: false
		};

		await globalActions.addQuestionToBank(newQuestion);
		// Auto-select the newly added question
		onQuestionAdded?.(newQuestion.id);
		setManualQuestion('');
		setManualOptions(['', '', '']);
		setShowManualForm(false);
	};

	const startEditing = (question: Question) => {
		setEditingId(question.id);
		setEditQuestion(question.text);
		setEditOptions([...question.options]);
	};

	const saveEdit = async () => {
		if (editingId && editQuestion.trim()) {
			const validOptions = editOptions.filter((o) => o.trim());
			if (validOptions.length >= 2) {
				await globalActions.updateQuestion(editingId, {
					text: editQuestion,
					options: validOptions
				});
				setEditingId(null);
				setEditQuestion('');
				setEditOptions([]);
			}
		}
	};

	const deleteQuestion = async (id: string) => {
		await globalActions.removeQuestionFromBank(id);
	};

	return (
		<div className="space-y-6">
			<div className="game-card">
				<h1 className="game-question mb-2">Question Manager</h1>
				<p className="text-slate-600">
					Generate AI questions or create custom ones for your game
				</p>
			</div>

			{/* AI Generation Section */}
			<div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-6">
				<div className="mb-4 flex items-center gap-2">
					<Wand2 className="size-5 text-blue-600" />
					<h2 className="font-semibold text-blue-900">AI Question Generator</h2>
				</div>

				<div className="space-y-3">
					<div>
						<label className="mb-2 block text-sm font-medium text-blue-900">
							Topics or Themes (one per line)
						</label>
						<div className="space-y-2">
							{aiTopics.map((topic, index) => (
								<div key={index} className="flex gap-2">
									<input
										type="text"
										value={topic}
										onChange={(e) => updateTopic(index, e.target.value)}
										placeholder="e.g., breakfast foods, movie genres, travel destinations"
										className="km-input flex-1"
									/>
									{aiTopics.length > 1 && (
										<button
											type="button"
											onClick={() => removeTopicInput(index)}
											className="km-btn-error"
										>
											<Trash2 className="size-5" />
										</button>
									)}
								</div>
							))}
						</div>
						<button
							type="button"
							onClick={addTopicInput}
							className="km-btn-secondary mt-2 w-full"
						>
							<Plus className="size-5" />
							Add Another Topic
						</button>
					</div>

					<div>
						<label className="mb-2 block text-sm font-medium text-blue-900">
							Number of Options
						</label>
						<select
							value={aiOptionCount}
							onChange={(e) => setAiOptionCount(parseInt(e.target.value))}
							className="km-input"
						>
							<option value={2}>2 Options</option>
							<option value={3}>3 Options</option>
						</select>
					</div>

					{aiGenerationStatus === 'generating' && totalBatchQuestions > 0 && (
						<div className="rounded-lg bg-blue-100 p-3">
							<p className="text-sm font-semibold text-blue-900">
								Generating {batchProgress} / {totalBatchQuestions} questions...
							</p>
							<div className="mt-2 h-2 w-full rounded-full bg-blue-200">
								<div
									className="h-full rounded-full bg-blue-600 transition-all duration-300"
									style={{
										width: `${totalBatchQuestions > 0 ? (batchProgress / totalBatchQuestions) * 100 : 0}%`
									}}
								/>
							</div>
						</div>
					)}

					<button
						type="button"
						onClick={generateBatchQuestions}
						disabled={
							aiGenerationStatus === 'generating' ||
							aiTopics.filter((t) => t.trim()).length === 0
						}
						className="km-btn-primary w-full"
					>
						{aiGenerationStatus === 'generating' ? (
							<>
								<div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
								Generating...
							</>
						) : (
							<>
								<Wand2 className="size-5" />
								Generate {aiTopics.filter((t) => t.trim()).length} Question
								{aiTopics.filter((t) => t.trim()).length !== 1 ? 's' : ''}
							</>
						)}
					</button>
				</div>
			</div>

			{/* Manual Creation Section */}
			<div className="rounded-xl border-2 border-purple-200 bg-purple-50 p-6">
				<h2 className="mb-4 font-semibold text-purple-900">
					Create Custom Question
				</h2>

				{!showManualForm ? (
					<button
						type="button"
						onClick={() => setShowManualForm(true)}
						className="km-btn-secondary w-full"
					>
						<Plus className="size-5" />
						New Custom Question
					</button>
				) : (
					<div className="space-y-3">
						<input
							type="text"
							value={manualQuestion}
							onChange={(e) => setManualQuestion(e.target.value)}
							placeholder="Question text..."
							className="km-input"
						/>

						{manualOptions.map((option, index) => (
							<input
								key={index}
								type="text"
								value={option}
								onChange={(e) => {
									const newOptions = [...manualOptions];
									newOptions[index] = e.target.value;
									setManualOptions(newOptions);
								}}
								placeholder={`Option ${index + 1}`}
								className="km-input"
							/>
						))}

						<div className="flex gap-2">
							<button
								type="button"
								onClick={addManualQuestion}
								className="km-btn-primary flex-1"
							>
								Add Question
							</button>
							<button
								type="button"
								onClick={() => setShowManualForm(false)}
								className="km-btn-secondary flex-1"
							>
								Cancel
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Question Queue */}
			<div>
				<h2 className="mb-4 font-semibold text-slate-900">
					Question Bank ({questionBank.length})
				</h2>

				{questionBank.length === 0 ? (
					<div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-6 text-center text-slate-600">
						No questions yet. Generate or create some!
					</div>
				) : (
					<div className="space-y-3">
						{questionBank.map((question) => (
							<div
								key={question.id}
								className={cn(
									'game-card',
									question.isAiGenerated
										? 'border-blue-300 from-blue-50'
										: 'border-purple-300 from-purple-50'
								)}
							>
								{editingId === question.id ? (
									<div className="space-y-3">
										<input
											type="text"
											value={editQuestion}
											onChange={(e) => setEditQuestion(e.target.value)}
											className="km-input"
										/>
										{editOptions.map((option, index) => (
											<input
												key={index}
												type="text"
												value={option}
												onChange={(e) => {
													const newOptions = [...editOptions];
													newOptions[index] = e.target.value;
													setEditOptions(newOptions);
												}}
												className="km-input"
											/>
										))}
										<div className="flex gap-2">
											<button
												onClick={saveEdit}
												className="km-btn-primary flex-1"
											>
												Save
											</button>
											<button
												onClick={() => setEditingId(null)}
												className="km-btn-secondary flex-1"
											>
												Cancel
											</button>
										</div>
									</div>
								) : (
									<>
										<div className="mb-3 flex items-start justify-between">
											<div className="flex-1">
												<p className="font-semibold text-slate-900">
													{question.text}
												</p>
												<div className="mt-2 space-y-1">
													{question.options.map((option, index) => (
														<p key={index} className="text-sm text-slate-600">
															{String.fromCharCode(65 + index)}: {option}
														</p>
													))}
												</div>
											</div>
											<span
												className={cn(
													'ml-3 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap',
													question.isAiGenerated
														? 'bg-blue-200 text-blue-700'
														: 'bg-purple-200 text-purple-700'
												)}
											>
												{question.isAiGenerated ? '🤖 AI' : '✏️ Manual'}
											</span>
										</div>

										<div className="flex gap-2">
											<button
												type="button"
												onClick={() => startEditing(question)}
												className="km-btn-secondary flex-1 text-sm"
											>
												Edit
											</button>
											<button
												type="button"
												onClick={() => deleteQuestion(question.id)}
												className="km-btn-error"
											>
												<Trash2 className="size-4" />
											</button>
										</div>
									</>
								)}
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

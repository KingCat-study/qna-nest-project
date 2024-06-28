import { Question } from '../entities/question.entity';
import { QuestionResponseDto } from './question-response.dto';

export function toQuestionResponseDto(question: Question): QuestionResponseDto {
  return {
    id: question.id,
    title: question.title,
    content: question.content,
    createdAt: question.createdAt,
    updatedAt: question.updatedAt,
    authorId: question.author.id,
  };
}
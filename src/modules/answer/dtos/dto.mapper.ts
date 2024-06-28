import { Answer } from '../entities/answer.entity';
import { AnswerResponseDto } from './answer-response.dto';

export function toAnswerResponseDto(answer: Answer, isLiked: boolean): AnswerResponseDto {
    return {
        id: answer.id,
        content: answer.content,
        createdAt: answer.createdAt,
        updatedAt: answer.updatedAt,
        authorId: answer.author.id,
        questionId: answer.question.id,
        isLiked,
    };
}
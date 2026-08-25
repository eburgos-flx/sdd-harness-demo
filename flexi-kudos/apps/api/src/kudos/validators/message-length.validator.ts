import {
  ValidationOptions,
  registerDecorator,
  ValidationArguments,
} from 'class-validator';

export const MAX_MESSAGE_CODE_POINTS = 280;

export function countCodePoints(value: string): number {
  return [...value].length;
}

export function IsMessageLength(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isMessageLength',
      target: object.constructor,
      propertyName,
      options: {
        message: 'message must be 1..280 code points after trim',
        ...validationOptions,
      },
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return false;
          const trimmed = value.trim();
          if (trimmed.length === 0) return false;
          return countCodePoints(trimmed) <= MAX_MESSAGE_CODE_POINTS;
        },
        defaultMessage(_args: ValidationArguments) {
          return 'message must be 1..280 code points after trim';
        },
      },
    });
  };
}

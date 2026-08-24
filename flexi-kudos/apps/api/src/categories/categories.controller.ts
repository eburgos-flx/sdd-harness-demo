import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { CategoryDto } from '@shared-types';
import { CATEGORIES } from './categories.constants';

@SkipThrottle()
@Controller('v1/categories')
export class CategoriesController {
  @Get()
  list(): readonly CategoryDto[] {
    return CATEGORIES;
  }
}

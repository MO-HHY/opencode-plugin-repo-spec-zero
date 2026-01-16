import { z } from 'zod';

try {
    const schema = z.enum(['a', 'b']);
    console.log('Array enum works');
} catch (e) {
    console.log('Array enum fails');
}

try {
    const schema = (z as any).enum('a', 'b');
    console.log('Variadic enum works');
} catch (e) {
    console.log('Variadic enum fails');
}

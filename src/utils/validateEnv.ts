/**
 * Environment variable validation utility
 * Validates that required environment variables are present and properly formatted
 */

export interface EnvironmentConfig {
  supabaseUrl: string | undefined;
  supabaseAnonKey: string | undefined;
  isProduction: boolean;
  isDevelopment: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config: EnvironmentConfig;
}

/**
 * Validates environment variables and returns validation results
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const mode = import.meta.env.MODE;

  const config: EnvironmentConfig = {
    supabaseUrl,
    supabaseAnonKey,
    isProduction: mode === 'production',
    isDevelopment: mode === 'development',
  };

  // Check if Supabase credentials are configured
  if (!supabaseUrl || !supabaseAnonKey) {
    warnings.push(
      'Supabase credentials are not configured. The app will run in local-only mode with limited functionality.'
    );
  } else {
    // Validate Supabase URL format
    try {
      const url = new URL(supabaseUrl);
      if (!url.hostname.includes('supabase')) {
        warnings.push('Supabase URL does not appear to be a valid Supabase URL');
      }
    } catch (e) {
      errors.push('VITE_SUPABASE_URL is not a valid URL');
    }

    // Validate anon key format (should be a JWT-like string)
    if (supabaseAnonKey.length < 100) {
      warnings.push('VITE_SUPABASE_ANON_KEY appears to be too short for a valid Supabase anon key');
    }
  }

  // Production-specific validations
  if (config.isProduction) {
    if (!supabaseUrl || !supabaseAnonKey) {
      errors.push('Supabase credentials are required in production mode');
    }
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    errors,
    warnings,
    config,
  };
}

/**
 * Logs validation results to console
 */
export function logValidationResults(result: ValidationResult): void {
  if (result.errors.length > 0) {
    console.error('❌ Environment validation errors:');
    result.errors.forEach((error) => console.error(`  - ${error}`));
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️  Environment validation warnings:');
    result.warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }

  if (result.isValid && result.errors.length === 0 && result.warnings.length === 0) {
    console.log('✅ Environment validation passed');
  }
}

/**
 * Validates environment and throws error if critical issues found
 */
export function validateEnvironmentOrThrow(): EnvironmentConfig {
  const result = validateEnvironment();
  logValidationResults(result);

  if (!result.isValid) {
    throw new Error(
      `Environment validation failed:\n${result.errors.join('\n')}`
    );
  }

  return result.config;
}

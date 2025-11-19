FROM php:8.1-apache

# Устанавливаем необходимые расширения
RUN docker-php-ext-install pdo pdo_mysql

# Устанавливаем MySQL client для скрипта ожидания
RUN apt-get update && apt-get install -y default-mysql-client curl

# Включаем mod_rewrite
RUN a2enmod rewrite

# Копируем исходный код
COPY . /var/www/html/


# Устанавливаем права
RUN chown -R www-data:www-data /var/www/html

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1


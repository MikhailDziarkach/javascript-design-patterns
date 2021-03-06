/**
 * Медиатор с каналами
 * */
var Mediator = (function () {
    /**
     * Хранилище каналов.
     * Канал представляет собой объект с двумя свойствами:
     * handlers {array} - обработчики этого канала (fn {function} и context {object})
     * nested {object} - вложенные каналы
     * */
    var storage = {},
        sep;

    /**
     * @constructor
     * */
    function Mediator (separator) {
        /**
         * По умолчанию неймспейсы будут разделены двоеточием
         * */
        sep = separator || ':';
    }

    /**
     * Добавляет подписчик в медиатор
     * @this {Mediator}
     * @param {string} channel Канал, на который подписывается обработчик
     * @param {function} handler Обработчик
     * @param {object} context Контекст выполнения обработчика
     * @returns {object} Ссылка на объект-медиатор для цепочки вызовов
     * */
    Mediator.prototype.on = function (channel, handler, context) {
        if (channel.length) {
            this.namespace(channel).handlers.push({
                fn: handler,
                context: context
            });
        }

        return this;
    };

    /**
     * Удаляет подписчики из медиатора
     * @this {Mediator}
     * @param {string} channel Канал, обработчики которого будут удалены
     * @param {boolean} withNested Логическое поле, которое позволяет отключить обработчики каналов-потомков
     * @returns {object} Ссылка на объект-медиатор для цепочки вызовов
     */
    Mediator.prototype.off = function(channel, withNested) {
        if (this.has(channel)) {
            var ch = this.namespace(channel);
            ch.handlers = [];

            if (withNested) {
                ch.nested = {};
            }
        }

        return this;
    };

    /**
     * Вызывает обработчики для конкретного канала с передачей в них данных
     * @private
     * @this {Mediator}
     * @param {array} handlers Массив с обработчиками
     * @param {object} data Объект с данными, который будет передан в качестве аргумента в обработчики
     * @returns {object} Ссылка на объект-медиатор для цепочки вызовов
     */
    Mediator.prototype._runHandlers = function(handlers, data) {
        for (var length = handlers.length, i = 0; i < length; i++) {
            handlers[i].fn.call(handlers[i].context, data);
        }

        return this;
    };

    /**
     * Рекурсивно вызывает обработчики с передачей в них данных
     * @private
     * @this {Mediator}
     * @param {object} namespace Пространство имен
     * @param {object} data Объект с данными, который будет передан в качестве аргумента в обработчики
     * @returns {object} Ссылка на объект-медиатор для цепочки вызовов
     */
    Mediator.prototype._runHandlersRecursive = function(namespace, data) {
        this._runHandlers(namespace.handlers, data);

        for (var ns in namespace.nested) {
            if (namespace.nested.hasOwnProperty(ns)) {
                this._runHandlersRecursive(namespace.nested[ns], data);
            }
        }

        return this;
    }

    /**
     * Вызывает обработчики для конкретного канала с передачей в них данных
     * @this {Mediator}
     * @param {string} channel Имя канала
     * @param {object} data Объект с данными, который будет передан в качестве аргумента в обработчики
     * @returns {object} Ссылка на объект-медиатор для цепочки вызовов
     */
    Mediator.prototype.trigger = function(channel, data) {
        if (this.has(channel)) {
            this._runHandlers(this.namespace(channel).handlers, data);
        } else {
            throw new Error('The channel does not exist!');
        }

        return this;
    };

    /**
     * Вызывает обработчики для конкретного канала и вложенных каналов с передачей в них данных
     * @this {Mediator}
     * @param {string} channel Имя канала
     * @param {object} data Объект с данными, который будет передан в качестве аргумента в обработчики
     * @returns {object} Ссылка на объект-медиатор для цепочки вызовов
     */
    Mediator.prototype.broadcast = function (channel, data) {
        if (this.has(channel)) {
            this._runHandlersRecursive(this.namespace(channel), data);
        } else {
            throw new Error('The channel does not exist!');
        }

        return this;
    };

    /**
     * Удаление все обработчиков из медиатора
     * @this {Mediator}
     * @returns {object} Ссылка на объект-медиатор для цепочки вызовов
     */
    Mediator.prototype.clean = function (){
        storage = {};
        return this;
    };

    /**
     * Проверка существования определенного неймспейса
     * @this {Mediator}
     * @param {string} channel Канал, который будет проверяться на наличие
     * @returns {boolean} Истина/ложь
     * */
    Mediator.prototype.has = function (channel) {
        if (!channel.length) return false;
        var parts = channel.split(sep),
            length = parts.length,
            i = 0,
            current = storage;

        for (; i < length; i++) {
            if (current[parts[i]] !== undefined) {
                current = current[parts[i]].nested;
            } else {
                return false;
            }
        }

        return true;
    };

    /**
     * Функция для управления пространством имен обработчиков
     * @this {Mediator}
     * @param {string} channel Канал
     * @returns {object} current Хранилище обработчиков канала
     * */
    Mediator.prototype.namespace = function (channel) {
        var parts = channel.split(sep),
            length = parts.length,
            i = 0,
            current = storage;

        /**
         * Возвращает объект заданной структуры
         *
         * @returns {object}
         * */
        function getUnit() {
            return {
                nested: {},
                handlers: []
            }
        }

        for (; i < length; i++) {
            current[parts[i]] = current[parts[i]] || getUnit();
            current = (i !== length - 1 ? current[parts[i]].nested : current[parts[i]]);
        }

        return current;
    }

    /**
     * Возвращает содержимое объекта с обработчиками. Только для отладки.
     * @this {Mediator}
     * @returns {object} storage Хранилище обработчиков
     * */
    Mediator.prototype.getStorage = function() {
        return storage;
    };

    return Mediator;
})();

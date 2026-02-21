# Directives


## TranslationDirective

Translation Directive (`v-t`)

**Signature:**
```typescript
export declare type TranslationDirective<T = HTMLElement> = ObjectDirective<T>;
```

**Details**

Update the element `textContent` that localized with locale messages.

You can use string syntax or object syntax.

String syntax can be specified as a keypath of locale messages.

If you can be used object syntax, you need to specify as the object key the following params
```
- path: required, key of locale messages
- locale: optional, locale
- args: optional, for list or named formatting
```



**Examples**


```html

<p v-t="'foo.bar'"></p>


<p v-t="msg"></p>


<p v-t="{ path: 'hi', locale: 'ja', args: { name: 'kazupon' } }"></p>


<p v-t="{ path: greeting, args: { name: fullName } }"></p>
```





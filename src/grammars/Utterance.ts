export const grammar = `
<grammar root="Utterance">
   <rule id="Utterance">
      <ruleref uri="#author"/>
      <tag>out.author=Object(); out.author.Name =rules.author.person;</tag>
   </rule>
   <rule id="nameofautor">
      <one-of>
         <item>to do is to be<tag>out="Socrates";</tag></item>
         <item>to be is to do<tag>out="Sartre";</tag></item>
         <item>do be do be do<tag>out="Sinatra";</tag></item>
      </one-of>
   </rule>
   <rule id="author">
      <ruleref uri="#nameofautor"/>
      <tag>out.person=rules.nameofautor;</tag>
   </rule>
</grammar>
`

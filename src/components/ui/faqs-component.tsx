'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const inlineLink = 'font-medium text-primary underline decoration-primary/35 underline-offset-4 transition-colors hover:decoration-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring';

const faqItems = [
  {
    id: 'item-1',
    question: 'Aster заменяет GPS?',
    answer: <>Нет. GPS/ГЛОНАСС дают в том числе информацию о местоположении. Aster определяет ориентацию аппарата по звёздам и дополняет бортовую навигационную систему, а не заменяет все её функции. Посмотрите <a href="#principle" className={inlineLink}>принцип звёздного ориентирования</a>.</>,
  },
  {
    id: 'item-2',
    question: 'Когда модуль может работать?',
    answer: <>Ночью, при видимом звёздном небе. Облачность, засветка и перекрытие поля зрения влияют на наблюдение. Движение аппарата также нужно учитывать при проверке интеграции. Эти условия показаны в <a href="#integration" className={inlineLink}>интерактивной модели установки</a>.</>,
  },
  {
    id: 'item-3',
    question: 'Для каких аппаратов он предназначен?',
    answer: <>Для промышленных БПЛА, выполняющих ночной мониторинг промышленных объектов. Возможность установки зависит от компоновки, питания, интерфейсов и требований к навигации. Подробнее — в разделе <a href="#applications" className={inlineLink}>ночных задач</a>.</>,
  },
  {
    id: 'item-4',
    question: 'Что показывает демонстрация?',
    answer: <>Это концептуальный макет, а не запись испытаний Aster. Звёздный датчик отвечает за ориентацию; сближение и посадка показаны как отдельный сценарий с локальным оптическим наведением. Можно <a href="#demo" className={inlineLink}>вернуться к демонстрации</a> и выбрать её этап.</>,
  },
  {
    id: 'item-5',
    question: 'Как обсудить интеграцию?',
    answer: <>Опишите платформу, условия полёта и требования к ориентации. Форма ниже поможет <a href="#contact" className={inlineLink}>подготовить бриф</a>. Сейчас она сохраняет текстовый файл на вашем устройстве и не отправляет данные команде.</>,
  },
];

function ContactNote({ className }: { className?: string }) {
  return <p className={className}>Не нашли свой вопрос? Начните с <a href="#contact" className={inlineLink}>брифа для вашей платформы</a>.</p>;
}

export default function FAQs() {
  return (
    <section id="questions" aria-labelledby="faq-heading" className="aster-faq bg-background py-16 text-foreground md:py-24">
      <div className="shell">
        <div className="grid gap-8 md:grid-cols-5 md:gap-12">
          <div className="md:col-span-2">
            <h2 id="faq-heading" className="text-foreground font-normal">По существу</h2>
            <p className="mt-5 max-w-sm text-base text-muted-foreground">Ответы об ориентации, условиях работы и интеграции Aster.</p>
            <ContactNote className="mt-7 hidden max-w-sm text-base text-muted-foreground md:block" />
          </div>

          <div className="min-w-0 md:col-span-3">
            <Accordion type="single" collapsible defaultValue="item-1" className="w-full" data-ui="faq-accordion">
              {faqItems.map((item, index) => (
                <AccordionItem key={item.id} value={item.id}>
                  <AccordionTrigger id={`question-${index}`} aria-controls={`answer-${index}`} className="cursor-pointer text-base hover:text-primary hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent id={`answer-${index}`} aria-labelledby={`question-${index}`}>
                    <p className="text-base text-muted-foreground">{item.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <ContactNote className="mt-2 text-base text-muted-foreground md:hidden" />
        </div>
      </div>
    </section>
  );
}

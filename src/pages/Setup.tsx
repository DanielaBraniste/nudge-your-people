{/* YOUR CATCH-UP LIST - NOW FIRST (when people exist) */}
        {people.length > 0 && (
          <Card className="shadow-lg border-0 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Your Catch-Up List ({people.length})</CardTitle>
              <CardDescription>People you're staying in touch with</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {people.map((person) => {
                const scheduledNotifications = JSON.parse(
                  localStorage.getItem('scheduledNotifications') || '{}'
                );
                const notification = scheduledNotifications[person.id];
                
                return (
                  <div
                    key={person.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="font-semibold">{person.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {person.frequency.charAt(0).toUpperCase() + person.frequency.slice(1)}
                        {" • "}
                        {getDisplayText(person)}
                        {" • "}
                        {person.method === "call" ? "📞 Call" : 
                         person.method === "text" ? "💬 Text" :
                         person.method === "dm" ? "📱 DM" : "✨ Other"}
                      </p>
                      {notification && (
                        <p className="text-xs text-muted-foreground/80">
                          Next reminder: {notification.formattedTime}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemovePerson(person.id)}
                    >
                      Remove
                    </Button>
                  </div>
                );
              })}

              <Button onClick={handleViewCalendar} className="w-full mt-6" size="lg" variant="default">
                <Calendar className="mr-2 h-4 w-4" />
                View Calendar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ADD SOMEONE FORM - NOW SECOND */}
        <Card className="shadow-lg border-0 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Add Someone to Catch Up With
            </CardTitle>
            <CardDescription>
              Set up reminders for the people you want to stay in touch with
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter person's name"
                value={currentPerson.name}
                onChange={(e) => setCurrentPerson({ ...currentPerson, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Frequency
              </Label>
              <Select
                value={currentPerson.frequency}
                onValueChange={(value) => setCurrentPerson({ ...currentPerson, frequency: value })}
              >
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="random">Random Intervals</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="method">Catch-up Method</Label>
              <Select
                value={currentPerson.method}
                onValueChange={(value: "call" | "text" | "dm" | "other") =>
                  setCurrentPerson({ ...currentPerson, method: value })
                }
              >
                <SelectTrigger id="method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">📞 Call</SelectItem>
                  <SelectItem value="text">💬 Text</SelectItem>
                  <SelectItem value="dm">📱 DM</SelectItem>
                  <SelectItem value="other">✨ Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time Preference
              </Label>
              <RadioGroup
                value={currentPerson.timeType}
                onValueChange={(value: "fixed" | "random") => 
                  setCurrentPerson({ ...currentPerson, timeType: value })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fixed" id="fixed" />
                  <Label htmlFor="fixed" className="font-normal cursor-pointer">
                    Fixed Day & Time
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="random" id="random" />
                  <Label htmlFor="random" className="font-normal cursor-pointer">
                    Random Within Time Window
                  </Label>
                </div>
              </RadioGroup>

              {currentPerson.timeType === "fixed" ? (
                <div className="space-y-4 ml-6">
                  {shouldShowDayOfWeekSelector() && (
                    <div className="space-y-2">
                      <Label htmlFor="fixedDay">Day of Week</Label>
                      <Select
                        value={currentPerson.fixedDay}
                        onValueChange={(value) =>
                          setCurrentPerson({ ...currentPerson, fixedDay: value })
                        }
                      >
                        <SelectTrigger id="fixedDay">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monday">Monday</SelectItem>
                          <SelectItem value="tuesday">Tuesday</SelectItem>
                          <SelectItem value="wednesday">Wednesday</SelectItem>
                          <SelectItem value="thursday">Thursday</SelectItem>
                          <SelectItem value="friday">Friday</SelectItem>
                          <SelectItem value="saturday">Saturday</SelectItem>
                          <SelectItem value="sunday">Sunday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {shouldShowDayOfMonthSelector() && (
                    <div className="space-y-2">
                      <Label htmlFor="fixedDayOfMonth">Day of Month</Label>
                      <Select
                        value={currentPerson.fixedDayOfMonth.toString()}
                        onValueChange={(value) =>
                          setCurrentPerson({ ...currentPerson, fixedDayOfMonth: parseInt(value) })
                        }
                      >
                        <SelectTrigger id="fixedDayOfMonth">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {dayOfMonthOptions.map((day) => {
                            const suffix = day === 1 ? 'st' : 
                                         day === 2 ? 'nd' : 
                                         day === 3 ? 'rd' : 
                                         day === 21 ? 'st' :
                                         day === 22 ? 'nd' :
                                         day === 23 ? 'rd' :
                                         day === 31 ? 'st' : 'th';
                            return (
                              <SelectItem key={day} value={day.toString()}>
                                {day}{suffix}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label>Select Time</Label>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1">
                        <Input
                          type="number"
                          min="0"
                          max="23"
                          value={parseInt(currentPerson.fixedTime.split(':')[0])}
                          onChange={(e) => {
                            let hour = parseInt(e.target.value) || 0;
                            hour = Math.max(0, Math.min(23, hour));
                            const currentMinute = currentPerson.fixedTime.split(':')[1];
                            setCurrentPerson({ 
                              ...currentPerson, 
                              fixedTime: `${hour.toString().padStart(2, '0')}:${currentMinute}` 
                            });
                          }}
                          onBlur={(e) => {
                            let hour = parseInt(e.target.value) || 0;
                            hour = Math.max(0, Math.min(23, hour));
                            const currentMinute = currentPerson.fixedTime.split(':')[1];
                            setCurrentPerson({ 
                              ...currentPerson, 
                              fixedTime: `${hour.toString().padStart(2, '0')}:${currentMinute}` 
                            });
                          }}
                          placeholder="HH"
                          className="text-center text-lg font-semibold"
                        />
                        <p className="text-xs text-muted-foreground text-center mt-1">Hour</p>
                      </div>
                      
                      <span className="text-2xl font-bold">:</span>
                      
                      <div className="flex-1">
                        <Input
                          type="number"
                          min="0"
                          max="59"
                          value={parseInt(currentPerson.fixedTime.split(':')[1])}
                          onChange={(e) => {
                            let minute = parseInt(e.target.value) || 0;
                            minute = Math.max(0, Math.min(59, minute));
                            const currentHour = currentPerson.fixedTime.split(':')[0];
                            setCurrentPerson({ 
                              ...currentPerson, 
                              fixedTime: `${currentHour}:${minute.toString().padStart(2, '0')}` 
                            });
                          }}
                          onBlur={(e) => {
                            let minute = parseInt(e.target.value) || 0;
                            minute = Math.max(0, Math.min(59, minute));
                            const currentHour = currentPerson.fixedTime.split(':')[0];
                            setCurrentPerson({ 
                              ...currentPerson, 
                              fixedTime: `${currentHour}:${minute.toString().padStart(2, '0')}` 
                            });
                          }}
                          placeholder="MM"
                          className="text-center text-lg font-semibold"
                        />
                        <p className="text-xs text-muted-foreground text-center mt-1">Minute</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 ml-6">
                  <Label htmlFor="timeWindow">Time Window</Label>
                  <Select
                    value={currentPerson.timeWindow}
                    onValueChange={(value: "morning" | "afternoon" | "evening") =>
                      setCurrentPerson({ ...currentPerson, timeWindow: value })
                    }
                  >
                    <SelectTrigger id="timeWindow">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning (7am - 11am)</SelectItem>
                      <SelectItem value="afternoon">Afternoon (1pm - 5pm)</SelectItem>
                      <SelectItem value="evening">Evening (6pm - 10pm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <Button onClick={handleAddPerson} className="w-full" size="lg">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Person
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Setup;
